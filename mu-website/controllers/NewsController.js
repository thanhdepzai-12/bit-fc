

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
  where,
  limit,
  serverTimestamp,
  startAfter,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../firebaseConfig.js";

// ─── COLLECTION REF ───────────────────────────────────────
const NEWS_COL = "news";
const colRef   = () => collection(db, NEWS_COL);

// ─── ERROR HELPER ─────────────────────────────────────────
function wrap(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error("[NewsController]", err);
      return { error: err.message || "Đã xảy ra lỗi. Vui lòng thử lại." };
    }
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Upload ảnh lên Cloudinary (unsigned, từ browser)
//   @param  {string} base64Input  — data:image/...;base64,...
//   @param  {string} [publicId]   — nếu truyền vào sẽ ghi đè ảnh cũ (update)
//   @returns {Promise<{ url: string, publicId: string }>}
//
//   Cloudinary tự compress + convert WebP + resize khi truy cập URL.
//   Không cần compress thủ công ở client.
// ─────────────────────────────────────────────────────────
async function uploadToCloudinary(base64Input, publicId = null) {
  if (!base64Input || !base64Input.startsWith("data:")) {
    // Người dùng paste URL ngoài → không upload
    return { url: base64Input, publicId: null };
  }

  const formData = new FormData();
  formData.append("file",           base64Input);
  formData.append("upload_preset",  CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder",         "news");

  // Nếu có publicId → Cloudinary sẽ overwrite ảnh cũ, không tạo file mới
  if (publicId) {
    // Chỉ lấy phần sau "news/" vì folder đã khai báo trên
    const pid = publicId.startsWith("news/") ? publicId.slice(5) : publicId;
    formData.append("public_id", pid);
    formData.append("overwrite",  "true");
  }

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
    url:      data.secure_url,   // URL gốc (chưa resize)
    publicId: data.public_id,    // vd: "news/abcd1234"
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL: Xoá ảnh trên Cloudinary
//   ⚠️  Xoá ảnh từ browser cần signed request (cần API secret).
//   Cách an toàn nhất với unsigned preset là để ảnh cũ tự hết hạn
//   hoặc dùng "overwrite" khi update (không tạo file mới).
//   Nếu muốn xoá thật sự → gọi qua backend/Cloud Function.
//   Hàm này để trống nhưng giữ lại để dễ mở rộng sau.
// ─────────────────────────────────────────────────────────
async function deleteFromCloudinary(_publicId) {
  // TODO: Gọi Cloud Function hoặc backend endpoint để xoá
  // DELETE https://api.cloudinary.com/v1_1/{cloud}/image/destroy  (cần signature)
  console.warn("[NewsController] Xoá ảnh Cloudinary cần backend — bỏ qua.");
}

// ─────────────────────────────────────────────────────────
// UTIL: Tạo URL resize động từ Cloudinary secure_url
//   @param  {string} url          — URL gốc từ Cloudinary
//   @param  {object} opts
//     - width   : number  (px)
//     - height  : number  (px)
//     - quality : "auto" | number 1–100  (mặc định "auto")
//     - format  : "auto" | "webp" | ...  (mặc định "auto" → Cloudinary tự chọn)
//     - crop    : "fill" | "fit" | "thumb" | ...  (mặc định "fill")
//   @returns {string} URL đã chèn transformation
//
//   Ví dụ dùng:
//     getResizedUrl(article.coverUrl, { width: 800, height: 450 })  // hero
//     getResizedUrl(article.coverUrl, { width: 400, height: 250 })  // card
//     getResizedUrl(article.coverUrl, { width: 80,  height: 80  })  // thumbnail
// ─────────────────────────────────────────────────────────
export function getResizedUrl(url, {
  width   = 800,
  height  = 450,
  quality = "auto",
  format  = "auto",
  crop    = "fill",
} = {}) {
  if (!url || !url.includes("cloudinary.com")) return url; // URL ngoài → trả thẳng

  // Cloudinary transformation được chèn sau "/upload/"
  const transform = `c_${crop},w_${width},h_${height},q_${quality},f_${format}`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

// ─────────────────────────────────────────────────────────
// 1. LẤY TẤT CẢ BÀI BÁO
//    @param {object} options
//      - statusFilter:   "published" | "draft" | ""
//      - categoryFilter: string | ""
//      - limitCount:     number (mặc định 50)
// ─────────────────────────────────────────────────────────
export const getAllNews = wrap(async ({
  statusFilter   = "",
  categoryFilter = "",
  limitCount     = 50,
} = {}) => {
  let q = query(colRef(), orderBy("publishedAt", "desc"), limit(limitCount));

  if (statusFilter) {
    q = query(
      colRef(),
      where("status", "==", statusFilter),
      orderBy("publishedAt", "desc"),
      limit(limitCount),
    );
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (categoryFilter) {
    results = results.filter(n => n.category === categoryFilter);
  }

  return results;
});

// ─────────────────────────────────────────────────────────
// 2. LẤY 1 BÀI BÁO THEO ID
// ─────────────────────────────────────────────────────────
export const getNewsById = wrap(async (newsId) => {
  const snap = await getDoc(doc(db, NEWS_COL, newsId));
  if (!snap.exists()) return { error: "Không tìm thấy bài báo." };
  return { id: snap.id, ...snap.data() };
});

// ─────────────────────────────────────────────────────────
// 3. LẤY BÀI BÁO THEO SLUG
// ─────────────────────────────────────────────────────────
export const getNewsBySlug = wrap(async (slug) => {
  const q = query(colRef(), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return { error: "Không tìm thấy bài báo." };
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
});

// ─────────────────────────────────────────────────────────
// 4. THÊM BÀI BÁO MỚI
//    @param {object}      newsData    — fields bài báo
//    @param {string|null} base64Image — data:image/...;base64,... hoặc null
// ─────────────────────────────────────────────────────────
export const addNews = wrap(async (newsData, base64Image = null) => {
  const now  = serverTimestamp();
  const slug = newsData.slug || generateSlug(newsData.title || "");

  let coverUrl      = newsData.coverUrl      || "";
  let coverPublicId = newsData.coverPublicId || "";

  if (base64Image) {
    const uploaded = await uploadToCloudinary(base64Image);
    coverUrl      = uploaded.url;
    coverPublicId = uploaded.publicId || "";
  }

  const docRef = await addDoc(colRef(), {
    ...sanitize(newsData),
    slug,
    coverUrl,
    coverPublicId,
    publishedAt: newsData.status === "published" ? now : null,
    createdAt:   now,
    updatedAt:   now,
  });

  return { id: docRef.id, ...sanitize(newsData), slug, coverUrl, coverPublicId };
});

// ─────────────────────────────────────────────────────────
// 5. CẬP NHẬT BÀI BÁO
//    @param {string}      newsId
//    @param {object}      newsData
//    @param {string|null} base64Image — ảnh mới (null = giữ nguyên)
// ─────────────────────────────────────────────────────────
export const updateNews = wrap(async (newsId, newsData, base64Image = null) => {
  const docRef   = doc(db, NEWS_COL, newsId);
  const existing = await getDoc(docRef);
  if (!existing.exists()) return { error: "Bài báo không tồn tại." };

  let coverUrl      = existing.data().coverUrl      ?? "";
  let coverPublicId = existing.data().coverPublicId ?? "";

  if (base64Image) {
    // Truyền publicId cũ → Cloudinary overwrite, không tạo file mới
    const uploaded = await uploadToCloudinary(base64Image, coverPublicId || null);
    coverUrl      = uploaded.url;
    coverPublicId = uploaded.publicId || coverPublicId;
  }

  const wasPublished = existing.data().status === "published";
  const nowPublished = newsData.status === "published";
  const publishedAt  = (!wasPublished && nowPublished)
    ? serverTimestamp()
    : (existing.data().publishedAt ?? null);

  const payload = {
    ...sanitize(newsData),
    slug: newsData.slug || existing.data().slug || generateSlug(newsData.title || ""),
    coverUrl,
    coverPublicId,
    publishedAt,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, payload);
  return { id: newsId, ...payload };
});

// ─────────────────────────────────────────────────────────
// 6. XÓA BÀI BÁO
// ─────────────────────────────────────────────────────────
export const deleteNews = wrap(async (newsId) => {
  const snap = await getDoc(doc(db, NEWS_COL, newsId));
  if (snap.exists() && snap.data().coverPublicId) {
    await deleteFromCloudinary(snap.data().coverPublicId); // no-op với unsigned preset
  }
  await deleteDoc(doc(db, NEWS_COL, newsId));
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// 7. PUBLISH / UNPUBLISH nhanh
// ─────────────────────────────────────────────────────────
export const publishNews = wrap(async (newsId) => {
  await updateDoc(doc(db, NEWS_COL, newsId), {
    status:      "published",
    publishedAt: serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });
  return { success: true };
});

export const unpublishNews = wrap(async (newsId) => {
  await updateDoc(doc(db, NEWS_COL, newsId), {
    status:    "draft",
    updatedAt: serverTimestamp(),
  });
  return { success: true };
});

// ─────────────────────────────────────────────────────────
// INTERNAL: Sinh slug từ tiêu đề tiếng Việt
// ─────────────────────────────────────────────────────────
export function generateSlug(title) {
  const vietnameseMap = {
    à:'a',á:'a',ả:'a',ã:'a',ạ:'a',
    ă:'a',ằ:'a',ắ:'a',ẳ:'a',ẵ:'a',ặ:'a',
    â:'a',ầ:'a',ấ:'a',ẩ:'a',ẫ:'a',ậ:'a',
    è:'e',é:'e',ẻ:'e',ẽ:'e',ẹ:'e',
    ê:'e',ề:'e',ế:'e',ể:'e',ễ:'e',ệ:'e',
    ì:'i',í:'i',ỉ:'i',ĩ:'i',ị:'i',
    ò:'o',ó:'o',ỏ:'o',õ:'o',ọ:'o',
    ô:'o',ồ:'o',ố:'o',ổ:'o',ỗ:'o',ộ:'o',
    ơ:'o',ờ:'o',ớ:'o',ở:'o',ỡ:'o',ợ:'o',
    ù:'u',ú:'u',ủ:'u',ũ:'u',ụ:'u',
    ư:'u',ừ:'u',ứ:'u',ử:'u',ữ:'u',ự:'u',
    ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y',
    đ:'d',
  };
  return title
    .toLowerCase()
    .split("")
    .map(c => vietnameseMap[c] ?? c)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
// ─────────────────────────────────────────────────────────
// 8. LẤY BÀI BÁO ĐÃ PUBLISH (PHÂN TRANG DÀNH CHO TRANG CHỦ)
// ─────────────────────────────────────────────────────────
export const getPublishedNewsPaginated = wrap(async (limitCount = 6, lastDoc = null) => {
  let q = query(
    colRef(),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(limitCount)
  );

  // Nếu bấm xem thêm, bắt đầu lấy từ sau bài báo cuối cùng của trang trước
  if (lastDoc) {
    q = query(
      colRef(),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc"),
      startAfter(lastDoc),
      limit(limitCount)
    );
  }

  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Lưu lại snapshot của bài báo cuối cùng để làm mốc cho lần tải tiếp theo
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { results, lastDoc: newLastDoc };
});

// ─────────────────────────────────────────────────────────
// LẮNG NGHE BÀI BÁO ĐÃ PUBLISH (REALTIME, DÙNG LIMIT DẦN LÊN THAY VÌ PHÂN TRANG)
// ─────────────────────────────────────────────────────────
export const listenPublishedNews = (limitCount = 6, callback) => {
  const cacheKey = `news_pub_${limitCount}`;
  const cachedStr = sessionStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      callback(JSON.parse(cachedStr));
    } catch(e){}
  }

  const q = query(
    colRef(),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snap) => {
    const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const payload = { results, hasMore: snap.docs.length === limitCount };
    sessionStorage.setItem(cacheKey, JSON.stringify(payload));
    callback(payload);
  }, (err) => {
    console.error("[NewsController] listenPublishedNews error:", err);
    callback({ error: err.message });
  });
};

// ─────────────────────────────────────────────────────────
// 9. LẤY CHI TIẾT BÀI BÁO ĐÃ PUBLISH BẰNG SLUG
// ─────────────────────────────────────────────────────────
export const getPublishedNewsBySlug = wrap(async (slug) => {
  const q = query(
    colRef(),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return { error: "Không tìm thấy bài báo hoặc bài báo đang bị ẩn." };
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
});
// ─────────────────────────────────────────────────────────
// INTERNAL: Làm sạch dữ liệu trước khi lưu
// ─────────────────────────────────────────────────────────
const VALID_CATEGORIES = [
  "Match Report","Official","Analysis","Team News",
  "Interview","Women","Rumour","Tickets","Loan Watch","Other",
];
const VALID_STATUSES = ["published","draft"];

function sanitize(data) {
  return {
    title:    String(data.title    || "").trim(),
    summary:  String(data.summary  || "").trim(),
    content:  String(data.content  || "").trim(),
    category: VALID_CATEGORIES.includes(data.category) ? data.category : "Other",
    author:   String(data.author   || "BIT FC").trim(),
    tags:     Array.isArray(data.tags)
      ? data.tags.map(t => String(t).trim()).filter(Boolean)
      : [],
    status:   VALID_STATUSES.includes(data.status) ? data.status : "draft",
  };
}