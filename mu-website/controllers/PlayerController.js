

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
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../firebaseConfig.js";

// ─── COLLECTION REF ───────────────────────────────────────
const PLAYERS_COL = "players";
const colRef = () => collection(db, PLAYERS_COL);

// ─── ERROR HELPER ─────────────────────────────────────────
function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[PlayerController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Upload ảnh lên Cloudinary (unsigned, từ browser)
// ─────────────────────────────────────────────────────────
async function uploadToCloudinary(base64Input) {
  if (!base64Input || !base64Input.startsWith("data:")) {
    // Người dùng paste URL ngoài → không upload
    return { url: base64Input, publicId: null };
  }

  const formData = new FormData();
  formData.append("file",           base64Input);
  formData.append("upload_preset",  CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder",         "players"); // Lưu vào folder players

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload Cloudinary thất bại.");
  }

  const data = await res.json();
  return {
    url:      data.secure_url,
    publicId: data.public_id,
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Xoá ảnh trên Cloudinary
// ─────────────────────────────────────────────────────────
async function deleteFromCloudinary(_publicId) {
  // TODO: Gọi Cloud Function hoặc backend endpoint để xoá
  console.warn("[PlayerController] Xoá ảnh Cloudinary cần backend — bỏ qua.");
}

// ─────────────────────────────────────────────────────────
// UTIL: Tạo URL resize động từ Cloudinary secure_url
// ─────────────────────────────────────────────────────────
export function getResizedUrl(url, {
  width   = 600,
  height  = 800,
  quality = "auto",
  format  = "auto",
  crop    = "fill",
} = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;

  const transform = `c_${crop},w_${width},h_${height},q_${quality},f_${format}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TOÀN BỘ CẦU THỦ
// ─────────────────────────────────────────────────────────
export const getAllPlayers = wrap(async () => {
  const q = query(colRef(), orderBy("number", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 CẦU THỦ THEO ID
// ─────────────────────────────────────────────────────────
export const getPlayerById = wrap(async (playerId) => {
  const snap = await getDoc(doc(db, PLAYERS_COL, playerId));
  if (!snap.exists()) return { error: "Không tìm thấy cầu thủ." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE TOÀN BỘ CẦU THỦ (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenAllPlayers = (callback) => {
  const cacheKey = "players_all";
  const cachedStr = sessionStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      callback(JSON.parse(cachedStr));
    } catch(e){}
  }

  const q = query(colRef(), orderBy("number", "asc"));
  return onSnapshot(q, (snap) => {
    const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessionStorage.setItem(cacheKey, JSON.stringify(players));
    callback(players);
  }, (err) => {
    console.error("[PlayerController] listenAllPlayers error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// LẮNG NGHE 1 CẦU THỦ THEO ID (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenPlayerById = (playerId, callback) => {
  const docRef = doc(db, PLAYERS_COL, playerId);
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback({ error: "Không tìm thấy cầu thủ." });
    } else {
      callback({ id: snap.id, ...snap.data() });
    }
  }, (err) => {
    console.error("[PlayerController] listenPlayerById error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 3. THÊM CẦU THỦ MỚI
// ─────────────────────────────────────────────────────────
export const addPlayer = wrap(async (playerData, base64Image = null) => {
  let imgUrl = playerData.imgUrl || "";
  let imgPublicId = playerData.imgPublicId || "";

  if (base64Image) {
    const uploaded = await uploadToCloudinary(base64Image);
    imgUrl = uploaded.url;
    imgPublicId = uploaded.publicId || "";
  }

  const docRef = await addDoc(colRef(), {
    ...sanitize(playerData),
    imgUrl,
    imgPublicId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, ...sanitize(playerData), imgUrl, imgPublicId };
});

// ─────────────────────────────────────────────────────────
// 4. CẬP NHẬT CẦU THỦ
// ─────────────────────────────────────────────────────────
export const updatePlayer = wrap(async (playerId, playerData, base64Image = null) => {
  const docRef = doc(db, PLAYERS_COL, playerId);
  const existing = await getDoc(docRef);
  if (!existing.exists()) return { error: "Cầu thủ không tồn tại." };

  let imgUrl = existing.data().imgUrl ?? (playerData.imgUrl ?? "");
  let imgPublicId = existing.data().imgPublicId ?? "";

  if (base64Image) {
    const uploaded = await uploadToCloudinary(base64Image);
    imgUrl = uploaded.url;
    imgPublicId = uploaded.publicId || imgPublicId;
  }

  const payload = {
    ...sanitize(playerData),
    imgUrl,
    imgPublicId,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
  return { id: playerId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 5. XÓA CẦU THỦ
// ─────────────────────────────────────────────────────────
export const deletePlayer = wrap(async (playerId) => {
  const snap = await getDoc(doc(db, PLAYERS_COL, playerId));
  if (snap.exists() && snap.data().imgPublicId) {
    await deleteFromCloudinary(snap.data().imgPublicId); 
  }
  await deleteDoc(doc(db, PLAYERS_COL, playerId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
function sanitize(data) {
  return {
    name:         String(data.name        || "").trim(),
    number:       Number(data.number)     || 0,
    pos:          String(data.pos         || "MID"),
    posLabel:     String(data.posLabel    || data.pos || "MID"),
    nationality:  String(data.nationality || "").trim(),
    birth:        String(data.birth       || "").trim(),
    joined:       Number(data.joined)     || new Date().getFullYear(),
    height:       String(data.height      || "").trim(),
    weight:       String(data.weight      || "").trim(),
    status:       ["active","injured","suspend"].includes(data.status) ? data.status : "active",
    goals:        Number(data.goals)       || 0,
    assists:      Number(data.assists)     || 0,
    appearances:  Number(data.appearances) || 0,
    cards:        String(data.cards       || "").trim(),
    bio:          String(data.bio         || "").trim(),
  };
}