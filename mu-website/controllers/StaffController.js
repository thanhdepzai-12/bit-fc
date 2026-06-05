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
const STAFFS_COL = "staffs";
const colRef = () => collection(db, STAFFS_COL);

// ─── ERROR HELPER ─────────────────────────────────────────
function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[StaffController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Upload ảnh lên Cloudinary (unsigned, từ browser)
// ─────────────────────────────────────────────────────────
async function uploadToCloudinary(base64Input) {
  if (!base64Input || !base64Input.startsWith("data:")) {
    return { url: base64Input, publicId: null };
  }

  const formData = new FormData();
  formData.append("file",          base64Input);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder",        "staffs");

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
  console.warn("[StaffController] Xoá ảnh Cloudinary cần backend — bỏ qua.");
}

// ─────────────────────────────────────────────────────────
// UTIL: Tạo URL resize động từ Cloudinary secure_url
// ─────────────────────────────────────────────────────────
export function getResizedUrl(url, {
  width   = 400,
  height  = 400,
  quality = "auto",
  format  = "auto",
  crop    = "fill",
} = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;
  const transform = `c_${crop},w_${width},h_${height},q_${quality},f_${format}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TOÀN BỘ STAFF
// ─────────────────────────────────────────────────────────
export const getAllStaffs = wrap(async () => {
  const q = query(colRef(), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 STAFF THEO ID
// ─────────────────────────────────────────────────────────
export const getStaffById = wrap(async (staffId) => {
  const snap = await getDoc(doc(db, STAFFS_COL, staffId));
  if (!snap.exists()) return { error: "Không tìm thấy thành viên." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE TOÀN BỘ STAFF (REALTIME)
// ─────────────────────────────────────────────────────────
export const listenAllStaffs = (callback) => {
  const q = query(colRef(), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => {
    const staffs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(staffs);
  }, (err) => {
    console.error("[StaffController] listenAllStaffs error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 3. THÊM STAFF MỚI
// ─────────────────────────────────────────────────────────
export const addStaff = wrap(async (staffData, base64Image = null) => {
  let imgUrl = staffData.imgUrl || "";
  let imgPublicId = staffData.imgPublicId || "";

  if (base64Image) {
    const uploaded = await uploadToCloudinary(base64Image);
    imgUrl = uploaded.url;
    imgPublicId = uploaded.publicId || "";
  }

  const docRef = await addDoc(colRef(), {
    ...sanitize(staffData),
    imgUrl,
    imgPublicId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, ...sanitize(staffData), imgUrl, imgPublicId };
});

// ─────────────────────────────────────────────────────────
// 4. CẬP NHẬT STAFF
// ─────────────────────────────────────────────────────────
export const updateStaff = wrap(async (staffId, staffData, base64Image = null) => {
  const docRef = doc(db, STAFFS_COL, staffId);
  const existing = await getDoc(docRef);
  if (!existing.exists()) return { error: "Thành viên không tồn tại." };

  let imgUrl = existing.data().imgUrl ?? (staffData.imgUrl ?? "");
  let imgPublicId = existing.data().imgPublicId ?? "";

  if (base64Image) {
    const uploaded = await uploadToCloudinary(base64Image);
    imgUrl = uploaded.url;
    imgPublicId = uploaded.publicId || imgPublicId;
  }

  const payload = {
    ...sanitize(staffData),
    imgUrl,
    imgPublicId,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
  return { id: staffId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 5. XÓA STAFF
// ─────────────────────────────────────────────────────────
export const deleteStaff = wrap(async (staffId) => {
  const snap = await getDoc(doc(db, STAFFS_COL, staffId));
  if (snap.exists() && snap.data().imgPublicId) {
    await deleteFromCloudinary(snap.data().imgPublicId);
  }
  await deleteDoc(doc(db, STAFFS_COL, staffId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
function sanitize(data) {
  return {
    name:        String(data.name        || "").trim(),
    role:        String(data.role        || "").trim(),
    roleLabel:   String(data.roleLabel   || data.role || "").trim(),
    nationality: String(data.nationality || "").trim(),
    birth:       String(data.birth       || "").trim(),
    joined:      Number(data.joined)     || new Date().getFullYear(),
    phone:       String(data.phone       || "").trim(),
    email:       String(data.email       || "").trim(),
    bio:         String(data.bio         || "").trim(),
    status:      ["active", "inactive"].includes(data.status) ? data.status : "active",
  };
}