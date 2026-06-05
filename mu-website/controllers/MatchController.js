import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../firebaseConfig.js";

const MATCHES_COL = "matches";
const PLAYERS_COL = "players";
const colRef = () => collection(db, MATCHES_COL);

function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[MatchController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Upload ảnh lên Cloudinary
// ─────────────────────────────────────────────────────────
async function uploadToCloudinary(base64Input) {
  if (!base64Input || !base64Input.startsWith("data:")) {
    return { url: base64Input, publicId: null };
  }

  const formData = new FormData();
  formData.append("file", base64Input);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "matches");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload Cloudinary thất bại.");
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

async function deleteFromCloudinary(_publicId) {
  console.warn("[MatchController] Xoá ảnh Cloudinary cần backend — bỏ qua.");
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TOÀN BỘ TRẬN ĐẤU
// ─────────────────────────────────────────────────────────
export const getAllMatches = wrap(async () => {
  const q = query(colRef(), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE TOÀN BỘ TRẬN ĐẤU (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenAllMatches = (callback) => {
  const cacheKey = "matches_all";
  const cachedStr = sessionStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      callback(JSON.parse(cachedStr));
    } catch(e){}
  }

  const q = query(colRef(), orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessionStorage.setItem(cacheKey, JSON.stringify(matches));
    callback(matches);
  }, (err) => {
    console.error("[MatchController] listenAllMatches error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 TRẬN ĐẤU THEO ID
// ─────────────────────────────────────────────────────────
export const getMatchById = wrap(async (matchId) => {
  const snap = await getDoc(doc(db, MATCHES_COL, matchId));
  if (!snap.exists()) return { error: "Không tìm thấy trận đấu." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// 3. THÊM TRẬN ĐẤU MỚI
// ─────────────────────────────────────────────────────────
export const addMatch = wrap(async (matchData, homeBase64 = null, awayBase64 = null) => {
  let homeLogo = matchData.homeLogo || "";
  let homePublicId = matchData.homePublicId || "";
  if (homeBase64) {
    const up = await uploadToCloudinary(homeBase64);
    homeLogo = up.url; homePublicId = up.publicId || "";
  }

  let awayLogo = matchData.awayLogo || "";
  let awayPublicId = matchData.awayPublicId || "";
  if (awayBase64) {
    const up = await uploadToCloudinary(awayBase64);
    awayLogo = up.url; awayPublicId = up.publicId || "";
  }

  const payload = sanitize(matchData);
  payload.homeLogo = homeLogo;
  payload.homePublicId = homePublicId;
  payload.awayLogo = awayLogo;
  payload.awayPublicId = awayPublicId;
  payload.createdAt = serverTimestamp();
  payload.updatedAt = serverTimestamp();

  const docRef = await addDoc(colRef(), payload);

  // Cập nhật bàn thắng cho các cầu thủ nếu có scorers
  if (payload.scorers && payload.scorers.length > 0) {
    for (const s of payload.scorers) {
      if (s.playerId && s.goals > 0) {
        await updateDoc(doc(db, PLAYERS_COL, s.playerId), { goals: increment(s.goals) });
      }
    }
  }

  return { id: docRef.id, ...payload };
});

// ─────────────────────────────────────────────────────────
// 4. CẬP NHẬT TRẬN ĐẤU
// ─────────────────────────────────────────────────────────
export const updateMatch = wrap(async (matchId, matchData, homeBase64 = null, awayBase64 = null) => {
  const docRef = doc(db, MATCHES_COL, matchId);
  const existingSnap = await getDoc(docRef);
  if (!existingSnap.exists()) return { error: "Trận đấu không tồn tại." };
  const existing = existingSnap.data();

  let homeLogo = existing.homeLogo ?? (matchData.homeLogo ?? "");
  let homePublicId = existing.homePublicId ?? "";
  if (homeBase64) {
    const up = await uploadToCloudinary(homeBase64);
    homeLogo = up.url; homePublicId = up.publicId || homePublicId;
  }

  let awayLogo = existing.awayLogo ?? (matchData.awayLogo ?? "");
  let awayPublicId = existing.awayPublicId ?? "";
  if (awayBase64) {
    const up = await uploadToCloudinary(awayBase64);
    awayLogo = up.url; awayPublicId = up.publicId || awayPublicId;
  }

  const payload = sanitize(matchData);
  payload.homeLogo = homeLogo;
  payload.homePublicId = homePublicId;
  payload.awayLogo = awayLogo;
  payload.awayPublicId = awayPublicId;
  payload.updatedAt = serverTimestamp();

  // Logic bù trừ bàn thắng cho cầu thủ
  const oldScorers = existing.scorers || [];
  const newScorers = payload.scorers || [];
  const diffs = {};

  oldScorers.forEach(s => { diffs[s.playerId] = -(s.goals || 0); });
  newScorers.forEach(s => { diffs[s.playerId] = (diffs[s.playerId] || 0) + (s.goals || 0); });

  for (const playerId in diffs) {
    if (diffs[playerId] !== 0) {
      try {
        await updateDoc(doc(db, PLAYERS_COL, playerId), { goals: increment(diffs[playerId]) });
      } catch (err) {
        console.warn(`Không thể cập nhật bàn thắng cho player ${playerId}`, err);
      }
    }
  }

  await updateDoc(docRef, payload);
  return { id: matchId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 5. XÓA TRẬN ĐẤU
// ─────────────────────────────────────────────────────────
export const deleteMatch = wrap(async (matchId) => {
  const snap = await getDoc(doc(db, MATCHES_COL, matchId));
  if (!snap.exists()) return { error: "Trận đấu không tồn tại." };
  
  const data = snap.data();
  if (data.homePublicId) await deleteFromCloudinary(data.homePublicId);
  if (data.awayPublicId) await deleteFromCloudinary(data.awayPublicId);

  // Trừ bàn thắng của các cầu thủ đã ghi bàn trong trận này
  if (data.scorers && data.scorers.length > 0) {
    for (const s of data.scorers) {
      if (s.playerId && s.goals > 0) {
        try {
          await updateDoc(doc(db, PLAYERS_COL, s.playerId), { goals: increment(-s.goals) });
        } catch (err) {}
      }
    }
  }

  await deleteDoc(doc(db, MATCHES_COL, matchId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
function sanitize(data) {
  return {
    date:       String(data.date || ""),
    time:       String(data.time || ""),
    comp:       String(data.comp || "Giao Hữu"),
    home:       String(data.home || ""),
    away:       String(data.away || ""),
    homeShort:  String(data.homeShort || "").substring(0, 4).toUpperCase(),
    awayShort:  String(data.awayShort || "").substring(0, 4).toUpperCase(),
    score:      String(data.score || ""),
    result:     ["w", "d", "l", "none"].includes(data.result) ? data.result : "none",
    venue:      String(data.venue || ""),
    isRemark:   Boolean(data.isRemark),
    isPublic:   Boolean(data.isPublic),
    // Lọc lại mảng scorers hợp lệ
    scorers:    Array.isArray(data.scorers) 
                ? data.scorers.filter(s => s.playerId && s.goals > 0).map(s => ({
                    playerId: String(s.playerId),
                    goals: Number(s.goals) || 0
                  }))
                : []
  };
}
