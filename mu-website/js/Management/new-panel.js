/**
 * news-panel.js
 * Logic quản lý tin tức: kết nối NewsController ↔ DOM
 */

import {
  getAllNews,
  addNews,
  updateNews,
  deleteNews,
  publishNews,
  unpublishNews,
  generateSlug,
} from "../../controllers/NewsController.js";

// ─── STATE ────────────────────────────────────────────────
let allArticles  = [];
let filteredData = [];
let sortCol      = "publishedAt";
let sortAsc      = false;
let filterCat    = "", filterStatus = "", filterSearch = "";
let editingId    = null, deletingId = null;
let coverBase64  = null;   // base64 ảnh mới chọn
const PAGE_SIZE  = 10;
let currentPage  = 1;

// ─── DOM ──────────────────────────────────────────────────
const tbody        = document.getElementById("news-tbody");
const searchInput  = document.getElementById("search-input");
const filterCatEl  = document.getElementById("filter-cat");
const filterStatEl = document.getElementById("filter-status");
const pgBar        = document.getElementById("pagination-bar");

// ─── INIT ─────────────────────────────────────────────────
async function init() {
  setDate();
  await loadArticles();
}

async function loadArticles() {
  const result = await getAllNews();
  if (result.error) { toast(result.error, "error"); return; }
  allArticles = result;
  applyFilters();
}

// ─── DATE ─────────────────────────────────────────────────
function setDate() {
  const el = document.getElementById("current-date");
  if (el) el.textContent = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── FILTER + SORT ────────────────────────────────────────
function applyFilters() {
  filteredData = allArticles.filter(a => {
    if (filterCat    && a.category !== filterCat)    return false;
    if (filterStatus && a.status   !== filterStatus) return false;
    if (filterSearch && !a.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    // Firestore Timestamp → ms
    if (va?.toMillis) va = va.toMillis();
    if (vb?.toMillis) vb = vb.toMillis();
    va = va ?? 0; vb = vb ?? 0;
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
  currentPage = 1;
  renderTable();
}

// ─── RENDER TABLE ─────────────────────────────────────────
function renderTable() {
  const total      = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filteredData.slice(start, start + PAGE_SIZE);

  // Counts
  const pubCount   = allArticles.filter(a => a.status === "published").length;
  const draftCount = allArticles.filter(a => a.status === "draft").length;
  document.getElementById("count-shown").textContent  = total;
  document.getElementById("count-total").textContent  = allArticles.length;
  document.getElementById("count-pub").textContent    = pubCount;
  document.getElementById("count-draft").textContent  = draftCount;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><i class="ti ti-news-off"></i>Không tìm thấy bài báo nào</div></td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tbody.innerHTML = items.map(a => {
    const catClass = getCatClass(a.category);
    const dateStr  = formatDate(a.publishedAt);
    return `
    <tr>
      <td class="col-cover">
        ${a.coverUrl
          ? `<img class="news-thumb" src="${a.coverUrl}" alt="${a.title}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
             <div class="news-thumb-fallback" style="display:none"><i class="ti ti-photo"></i></div>`
          : `<div class="news-thumb-fallback"><i class="ti ti-photo"></i></div>`}
      </td>
      <td class="col-title">
        <div class="news-title-cell">
          <div class="news-title-text" title="${a.title}">${a.title}</div>
          ${a.summary ? `<div class="news-summary-text">${a.summary}</div>` : ""}
        </div>
      </td>
      <td class="col-cat"><span class="cat-badge ${catClass}">${a.category || "—"}</span></td>
      <td class="col-author">${a.author || "—"}</td>
      <td class="col-date">${dateStr}</td>
      <td class="col-status"><span class="status-badge status-${a.status || "draft"}">${a.status === "published" ? "Published" : "Draft"}</span></td>
      <td class="col-action">
        <div class="action-btns">
          <button class="act-btn act-toggle" onclick="toggleStatus('${a.id}','${a.status}')"
            title="${a.status === "published" ? "Chuyển draft" : "Publish"}">
            <i class="ti ti-${a.status === "published" ? "eye-off" : "send"}"></i>
          </button>
          <button class="act-btn act-edit"  onclick="openEdit('${a.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
          <button class="act-btn act-del"   onclick="openDelete('${a.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join("");

  renderPagination(total, currentPage, totalPages);
}

// ─── PAGINATION ───────────────────────────────────────────
function renderPagination(total, page, totalPages) {
  if (!pgBar) return;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  const info  = pgBar.querySelector(".pagination-info");
  if (info) info.innerHTML = total === 0 ? "Không có dữ liệu" : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> bài`;

  const pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page-1); i <= Math.min(totalPages-1, page+1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const ctrl = pgBar.querySelector(".pagination-controls");
  ctrl.innerHTML = `
    <button class="page-btn" id="pg-prev" ${page<=1?"disabled":""} title="Trang trước"><i class="ti ti-chevron-left"></i></button>
    ${pages.map(p => p === "..." ? `<span class="page-ellipsis">…</span>` : `<button class="page-btn ${p===page?"active":""}" data-page="${p}">${p}</button>`).join("")}
    <button class="page-btn" id="pg-next" ${page>=totalPages?"disabled":""} title="Trang sau"><i class="ti ti-chevron-right"></i></button>
  `;
  ctrl.querySelector("#pg-prev")?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderTable(); }});
  ctrl.querySelector("#pg-next")?.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; renderTable(); }});
  ctrl.querySelectorAll(".page-btn[data-page]").forEach(btn => btn.addEventListener("click", () => { currentPage = +btn.dataset.page; renderTable(); }));
}

// ─── SORT ─────────────────────────────────────────────────
document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.dataset.col;
    sortAsc = sortCol === col ? !sortAsc : true;
    sortCol = col;
    document.querySelectorAll("th.sortable").forEach(t => t.classList.remove("sort-asc","sort-desc"));
    th.classList.add(sortAsc ? "sort-asc" : "sort-desc");
    applyFilters();
  });
});

// ─── FILTERS ──────────────────────────────────────────────
searchInput.addEventListener("input",  e => { filterSearch = e.target.value; applyFilters(); });
filterCatEl.addEventListener("change", e => { filterCat    = e.target.value; applyFilters(); });
filterStatEl.addEventListener("change",e => { filterStatus = e.target.value; applyFilters(); });

// ─── TOGGLE PUBLISH ───────────────────────────────────────
window.toggleStatus = async (id, currentStatus) => {
  const fn     = currentStatus === "published" ? unpublishNews : publishNews;
  const result = await fn(id);
  if (result.error) { toast(result.error, "error"); return; }
  const label = currentStatus === "published" ? "Đã chuyển về Draft" : "Đã Publish";
  const idx = allArticles.findIndex(a => a.id === id);
  if (idx !== -1) allArticles[idx].status = currentStatus === "published" ? "draft" : "published";
  toast(label); applyFilters();
};

// ─── FORM MODAL ───────────────────────────────────────────
function resetForm() {
  ["f-title","f-slug","f-author","f-summary","f-content","f-tags","f-cover-url"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  document.getElementById("f-cat").value    = "";
  document.getElementById("f-status").value = "published";
  setStatusToggle("published");
  resetCoverPreview();
}

function openFormModal(title) {
  document.getElementById("form-modal-title").innerHTML = title;
  document.getElementById("form-modal").classList.add("open");
}

function closeFormModal() {
  document.getElementById("form-modal").classList.remove("open");
  editingId = null; coverBase64 = null;
}

document.getElementById("btn-add-news").addEventListener("click", () => {
  editingId = null;
  resetForm();
  document.getElementById("form-modal-title").innerHTML = 'Thêm <span>Bài Báo</span>';
  document.getElementById("form-save-btn").innerHTML = '<i class="ti ti-device-floppy"></i> Thêm bài báo';
  openFormModal('Thêm <span>Bài Báo</span>');
});

window.openEdit = (id) => {
  const a = allArticles.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  document.getElementById("f-title").value   = a.title   || "";
  document.getElementById("f-slug").value    = a.slug    || "";
  document.getElementById("f-author").value  = a.author  || "";
  document.getElementById("f-cat").value     = a.category|| "";
  document.getElementById("f-summary").value = a.summary || "";
  document.getElementById("f-content").value = a.content || "";
  document.getElementById("f-tags").value    = (a.tags || []).join(", ");
  document.getElementById("f-cover-url").value = a.coverUrl || "";
  document.getElementById("f-status").value  = a.status  || "published";
  setStatusToggle(a.status || "published");
  // Preview ảnh hiện tại
  if (a.coverUrl) showCoverPreview(a.coverUrl);
  else resetCoverPreview();
  coverBase64 = null;
  document.getElementById("form-modal-title").innerHTML = 'Sửa <span>Bài Báo</span>';
  document.getElementById("form-save-btn").innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thay đổi';
  openFormModal('Sửa <span>Bài Báo</span>');
};

document.getElementById("form-modal-close").addEventListener("click", closeFormModal);
document.getElementById("form-cancel-btn").addEventListener("click", closeFormModal);
document.getElementById("form-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeFormModal(); });

// Auto slug from title
document.getElementById("f-title").addEventListener("input", e => {
  if (!editingId) document.getElementById("f-slug").value = generateSlug(e.target.value);
});

// SAVE
document.getElementById("form-save-btn").addEventListener("click", async () => {
  const title  = document.getElementById("f-title").value.trim();
  const cat    = document.getElementById("f-cat").value;
  if (!title) { toast("Vui lòng nhập tiêu đề", "error"); return; }
  if (!cat)   { toast("Vui lòng chọn danh mục", "error"); return; }

  const data = {
    title,
    slug:     document.getElementById("f-slug").value.trim()    || generateSlug(title),
    author:   document.getElementById("f-author").value.trim()  || "BIT FC Media",
    category: cat,
    summary:  document.getElementById("f-summary").value.trim(),
    content:  document.getElementById("f-content").value.trim(),
    tags:     document.getElementById("f-tags").value.split(",").map(t => t.trim()).filter(Boolean),
    coverUrl: document.getElementById("f-cover-url").value.trim(),
    status:   document.getElementById("f-status").value,
  };

  const btn = document.getElementById("form-save-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader"></i> Đang lưu...';

  let result;
  if (editingId) {
    result = await updateNews(editingId, data, coverBase64);
    if (!result.error) {
      const idx = allArticles.findIndex(a => a.id === editingId);
      if (idx !== -1) allArticles[idx] = { ...allArticles[idx], ...result };
      toast(`Đã cập nhật "${title}"`);
    }
  } else {
    result = await addNews(data, coverBase64);
    if (!result.error) {
      allArticles.unshift({ ...data, ...result });
      toast(`Đã thêm "${title}"`);
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Lưu bài báo';

  if (result.error) { toast(result.error, "error"); return; }
  closeFormModal();
  applyFilters();
});

// ─── DELETE MODAL ─────────────────────────────────────────
window.openDelete = (id) => {
  deletingId = id;
  const a = allArticles.find(x => x.id === id);
  document.getElementById("delete-news-title").textContent = a ? `"${a.title}"` : "?";
  document.getElementById("delete-modal").classList.add("open");
};
function closeDeleteModal() { document.getElementById("delete-modal").classList.remove("open"); }
document.getElementById("delete-cancel-btn").addEventListener("click", closeDeleteModal);
document.getElementById("delete-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeDeleteModal(); });
document.getElementById("delete-confirm-btn").addEventListener("click", async () => {
  const a = allArticles.find(x => x.id === deletingId);
  const btn = document.getElementById("delete-confirm-btn");
  btn.disabled = true; btn.textContent = "Đang xóa...";
  const result = await deleteNews(deletingId);
  btn.disabled = false; btn.textContent = "Xóa ngay";
  if (result.error) { toast(result.error, "error"); return; }
  allArticles = allArticles.filter(x => x.id !== deletingId);
  toast(`Đã xóa "${a?.title}"`, "error");
  closeDeleteModal(); applyFilters();
});

// ─── COVER UPLOAD ─────────────────────────────────────────
const dropZone      = document.getElementById("cover-drop-zone");
const fileInput     = document.getElementById("cover-file-input");
const previewImg    = document.getElementById("cover-preview-img");
const placeholder   = document.getElementById("cover-placeholder");
const coverActions  = document.getElementById("cover-actions");
const previewWrap   = document.getElementById("cover-preview-wrap");

previewWrap.addEventListener("click", () => { if (!previewImg.src || previewImg.style.display === "none") fileInput.click(); });
document.getElementById("cover-change-btn").addEventListener("click", () => fileInput.click());
document.getElementById("cover-remove-btn").addEventListener("click", () => {
  resetCoverPreview();
  coverBase64 = null;
  document.getElementById("f-cover-url").value = "";
});

fileInput.addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast("Ảnh tối đa 5MB", "error"); return; }
  readFileAsBase64(file);
});

// Drag & drop
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave",()=> dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault(); dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) { toast("Vui lòng chọn file ảnh", "error"); return; }
  if (file.size > 5 * 1024 * 1024) { toast("Ảnh tối đa 5MB", "error"); return; }
  readFileAsBase64(file);
});

function readFileAsBase64(file) {
  const reader = new FileReader();
  reader.onload = e => {
    coverBase64 = e.target.result;
    showCoverPreview(coverBase64);
  };
  reader.readAsDataURL(file);
}

function showCoverPreview(src) {
  previewImg.src             = src;
  previewImg.style.display   = "block";
  placeholder.style.display  = "none";
  coverActions.style.display = "flex";
}

function resetCoverPreview() {
  previewImg.src             = "";
  previewImg.style.display   = "none";
  placeholder.style.display  = "flex";
  coverActions.style.display = "none";
  fileInput.value            = "";
}

// URL ngoài → preview ngay
document.getElementById("f-cover-url").addEventListener("input", e => {
  const url = e.target.value.trim();
  if (url) { showCoverPreview(url); coverBase64 = null; }
  else if (!coverBase64) resetCoverPreview();
});

// ─── STATUS TOGGLE ────────────────────────────────────────
function setStatusToggle(val) {
  document.querySelectorAll(".status-toggle-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.val === val);
  });
  document.getElementById("f-status").value = val;
}
document.querySelectorAll(".status-toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => setStatusToggle(btn.dataset.val));
});

// ─── HAMBURGER ────────────────────────────────────────────
const sidebar   = document.getElementById("sidebar");
const overlay   = document.getElementById("sidebar-overlay");
const hamburger = document.getElementById("hamburger-btn");
hamburger.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  hamburger.classList.toggle("open", open);
  overlay.classList.toggle("visible", open);
});
overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  hamburger.classList.remove("open");
  overlay.classList.remove("visible");
});

// ─── HELPERS ──────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const CAT_MAP = {
  "Match Report": "cat-match", "Official": "cat-official", "Analysis": "cat-analysis",
  "Team News": "cat-team", "Interview": "cat-team", "Women": "cat-match",
  "Rumour": "cat-other", "Tickets": "cat-official", "Loan Watch": "cat-other", "Other": "cat-other",
};
function getCatClass(cat) { return CAT_MAP[cat] || "cat-other"; }

function toast(msg, type = "success") {
  const wrap = document.getElementById("toast-wrap");
  const el   = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<i class="ti ti-${type === "success" ? "circle-check" : "alert-circle"}"></i>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── START ────────────────────────────────────────────────
init();