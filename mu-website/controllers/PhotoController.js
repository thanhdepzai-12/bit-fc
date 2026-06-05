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
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../firebaseConfig.js";

// ─── COLLECTION REF ───────────────────────────────────────
const PHOTOS_COL = "photos";
const colRef = () => collection(db, PHOTOS_COL);

// ─── ERROR HELPER ─────────────────────────────────────────
function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[PhotoController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Upload ảnh lên Cloudinary (unsigned, từ browser)
// ─────────────────────────────────────────────────────────
export async function uploadPhotoToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "photos");

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
    width: data.width,
    height: data.height,
  };
}

// ─────────────────────────────────────────────────────────
// UTIL: Tạo URL resize động từ Cloudinary secure_url
// ─────────────────────────────────────────────────────────
export function getResizedPhotoUrl(url, {
  width   = 600,
  quality = "auto",
  format  = "auto",
  crop    = "fill",
} = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;
  const transform = `c_${crop},w_${width},q_${quality},f_${format}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TOÀN BỘ ẢNH
// ─────────────────────────────────────────────────────────
export const getAllPhotos = wrap(async () => {
  const q = query(colRef(), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 ẢNH THEO ID
// ─────────────────────────────────────────────────────────
export const getPhotoById = wrap(async (photoId) => {
  const snap = await getDoc(doc(db, PHOTOS_COL, photoId));
  if (!snap.exists()) return { error: "Không tìm thấy ảnh." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE TOÀN BỘ ẢNH (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenAllPhotos = (callback) => {
  const cacheKey = "photos_all";
  const cachedStr = sessionStorage.getItem(cacheKey);
  if (cachedStr) {
    try { callback(JSON.parse(cachedStr)); } catch(e){}
  }

  const q = query(colRef(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    sessionStorage.setItem(cacheKey, JSON.stringify(photos));
    callback(photos);
  }, (err) => {
    console.error("[PhotoController] listenAllPhotos error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// LẮNG NGHE ẢNH VỚI GIỚI HẠN (cho trang chủ)
// ─────────────────────────────────────────────────────────
export const listenPhotosLimited = (limitCount, callback) => {
  const q = query(colRef(), orderBy("createdAt", "desc"), limit(limitCount));
  return onSnapshot(q, (snap) => {
    const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(photos);
  }, (err) => {
    console.error("[PhotoController] listenPhotosLimited error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 3. THÊM ẢNH MỚI (hỗ trợ batch upload)
// ─────────────────────────────────────────────────────────
export const addPhoto = wrap(async (photoData) => {
  const docRef = await addDoc(colRef(), {
    ...sanitize(photoData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...sanitize(photoData) };
});

// Batch upload nhiều file cùng lúc
export const batchUploadPhotos = async (files, tag = "") => {
  const results = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const uploaded = await uploadPhotoToCloudinary(file);
      const photoData = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Tên file bỏ extension
        url: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        tag: tag,
      };
      const saved = await addPhoto(photoData);
      results.push(saved);
    } catch (err) {
      errors.push({ file: file.name, error: err.message });
    }
  }

  return { results, errors };
};

// ─────────────────────────────────────────────────────────
// 4. CẬP NHẬT ẢNH
// ─────────────────────────────────────────────────────────
export const updatePhoto = wrap(async (photoId, photoData) => {
  const docRef = doc(db, PHOTOS_COL, photoId);
  const existing = await getDoc(docRef);
  if (!existing.exists()) return { error: "Ảnh không tồn tại." };

  const payload = {
    ...sanitize(photoData),
    // Giữ lại URL và publicId gốc nếu không thay đổi
    url: photoData.url || existing.data().url,
    publicId: photoData.publicId || existing.data().publicId,
    width: photoData.width || existing.data().width,
    height: photoData.height || existing.data().height,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
  return { id: photoId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 5. XÓA ẢNH
// ─────────────────────────────────────────────────────────
export const deletePhoto = wrap(async (photoId) => {
  const snap = await getDoc(doc(db, PHOTOS_COL, photoId));
  if (snap.exists() && snap.data().publicId) {
    console.warn("[PhotoController] Xoá ảnh Cloudinary cần backend — bỏ qua.");
  }
  await deleteDoc(doc(db, PHOTOS_COL, photoId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
function sanitize(data) {
  return {
    title:    String(data.title || "").trim(),
    url:      String(data.url || "").trim(),
    publicId: String(data.publicId || "").trim(),
    width:    Number(data.width) || 0,
    height:   Number(data.height) || 0,
    tag:      String(data.tag || "").trim(),
  };
}
