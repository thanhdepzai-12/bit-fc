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

import { db } from "../firebaseConfig.js";

// ─── COLLECTION REF ───────────────────────────────────────
const GALLERY_COL = "galleries";
const colRef = () => collection(db, GALLERY_COL);

// ─── ERROR HELPER ─────────────────────────────────────────
function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[GalleryController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TOÀN BỘ GALLERY
// ─────────────────────────────────────────────────────────
export const getAllGalleryItems = wrap(async () => {
  const q = query(colRef(), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 ITEM THEO ID
// ─────────────────────────────────────────────────────────
export const getGalleryItemById = wrap(async (itemId) => {
  const snap = await getDoc(doc(db, GALLERY_COL, itemId));
  if (!snap.exists()) return { error: "Không tìm thấy video." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE TOÀN BỘ GALLERY (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenAllGalleryItems = (callback) => {
  const q = query(colRef(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error("[GalleryController] listenAllGalleryItems error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 3. THÊM ITEM MỚI
// ─────────────────────────────────────────────────────────
export const addGalleryItem = wrap(async (itemData) => {
  const docRef = await addDoc(colRef(), {
    ...sanitize(itemData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...sanitize(itemData) };
});

// ─────────────────────────────────────────────────────────
// 4. CẬP NHẬT ITEM
// ─────────────────────────────────────────────────────────
export const updateGalleryItem = wrap(async (itemId, itemData) => {
  const docRef = doc(db, GALLERY_COL, itemId);
  const existing = await getDoc(docRef);
  if (!existing.exists()) return { error: "Video không tồn tại." };

  const payload = {
    ...sanitize(itemData),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
  return { id: itemId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 5. XÓA ITEM
// ─────────────────────────────────────────────────────────
export const deleteGalleryItem = wrap(async (itemId) => {
  await deleteDoc(doc(db, GALLERY_COL, itemId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
function sanitize(data) {
  return {
    title:     String(data.title || "").trim(),
    videoId:   String(data.videoId || "").trim(),
    thumbnail: String(data.thumbnail || "").trim(),
    category:  ["video", "photo"].includes(data.category) ? data.category : "video",
    tag:       String(data.tag || "").trim(),
  };
}
