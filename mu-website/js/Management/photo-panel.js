import {
  getAllPhotos,
  addPhoto,
  updatePhoto,
  deletePhoto,
} from '../../controllers/PhotoController.js';

/* ══════════════════════════════════════════════════════════
   BIT FC — PHOTO PANEL JS (TABLE MODE)
   ══════════════════════════════════════════════════════════ */

/* ── STATE ── */
let photos = [];
let sortCol = 'createdAt', sortAsc = false;
let filterSearch = '', filterTag = '';
let editingId = null, deletingId = null;
let pendingFiles = [];

/* ── PAGINATION ── */
const PAGE_SIZE = 10;
let currentPage = 1;

/* ── HELPERS ── */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError ? 'var(--red-primary)' : 'var(--red-dark)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSize(w, h) {
  if (!w || !h) return "—";
  return `${w}×${h}`;
}

/* ── DOM ── */
const tableBody     = document.getElementById('table-body');
const searchInput   = document.getElementById('search-input');
const filterTagSel  = document.getElementById('filter-tag');

const uploadModal   = document.getElementById('upload-modal');
const btnUpload     = document.getElementById('btn-upload');
const btnCloseUp    = document.getElementById('btn-close-upload');
const btnCancelUp   = document.getElementById('btn-cancel-upload');
const btnStartUp    = document.getElementById('btn-start-upload');
const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const previewList   = document.getElementById('upload-preview-list');
const progressWrap  = document.getElementById('upload-progress');
const progressText  = document.getElementById('progress-text');
const progressFill  = document.getElementById('progress-fill');

const editModal     = document.getElementById('edit-modal');
const btnCloseEdit  = document.getElementById('btn-close-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveEdit   = document.getElementById('btn-save-edit');

const delModal      = document.getElementById('delete-modal');
const btnCancelDel  = document.getElementById('btn-cancel-del');
const btnConfirmDel = document.getElementById('btn-confirm-del');

const lightbox      = document.getElementById('photo-lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

/* ══════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════ */
async function init() {
  await loadData();
  setupEvents();
  const dateEl = document.getElementById('current-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function loadData() {
  tableBody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="spinner"></div> Đang tải dữ liệu...</td></tr>`;
  const res = await getAllPhotos();
  if (res.error) {
    showToast(res.error, true);
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color:var(--red-primary)">Lỗi: ${res.error}</td></tr>`;
    return;
  }
  photos = res;
  buildTagFilter();
  renderTable();
}

/* ── TAG FILTER ── */
function buildTagFilter() {
  const tags = [...new Set(photos.map(p => p.tag).filter(Boolean))].sort();
  filterTagSel.innerHTML = '<option value="">Tất cả tag</option>' +
    tags.map(t => `<option value="${t}">${t}</option>`).join('');
}

/* ══════════════════════════════════════════════════════════
   RENDER TABLE
   ══════════════════════════════════════════════════════════ */
function getFilteredAndSorted() {
  let arr = [...photos];
  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    arr = arr.filter(p => (p.title || '').toLowerCase().includes(s) || (p.tag || '').toLowerCase().includes(s));
  }
  if (filterTag) {
    arr = arr.filter(p => p.tag === filterTag);
  }
  arr.sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    // Handle Firestore Timestamps
    if (valA?.seconds) valA = valA.seconds;
    if (valB?.seconds) valB = valB.seconds;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });
  return arr;
}

function renderTable() {
  const processed = getFilteredAndSorted();
  const total = processed.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const currentData = processed.slice(startIdx, endIdx);

  document.getElementById('count-shown').textContent = total;
  document.getElementById('count-total').textContent = photos.length;

  if (currentData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Không có ảnh nào.</td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tableBody.innerHTML = currentData.map(p => {
    const dateStr = formatDate(p.createdAt);
    const sizeStr = formatSize(p.width, p.height);
    const thumbHtml = p.url
      ? `<img src="${p.url}" alt="${p.title}" class="avatar-circle" style="border-radius:6px; width:48px; height:48px; object-fit:cover; cursor:pointer;" onclick="window._openLightbox('${p.url}')" onerror="this.src='../../assessts/logoBit.png'" />`
      : `<div class="empty-avatar" style="border-radius:6px;"><i class="ti ti-photo"></i></div>`;
    const tagBadge = p.tag
      ? `<span class="role-badge role-training">${p.tag}</span>`
      : '—';

    return `
      <tr>
        <td style="width:70px; text-align:center;">${thumbHtml}</td>
        <td>
          <div style="font-weight:600; color:var(--white);">${p.title || 'Untitled'}</div>
        </td>
        <td>${tagBadge}</td>
        <td style="font-size:0.8rem; color:var(--gray-mid);">${dateStr}</td>
        <td style="font-family:monospace; font-size:0.75rem; color:var(--gray-mid);">${sizeStr}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="window._editPhoto('${p.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
            <button class="btn-icon btn-icon-del" onclick="window._deletePhoto('${p.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination(total, currentPage, totalPages);
}

/* ── PAGINATION ── */
function renderPagination(total, page, totalPages) {
  const bar = document.getElementById('pagination-bar');
  if (!bar) return;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const info = bar.querySelector('.pagination-info');
  if (info) {
    info.innerHTML = total === 0
      ? 'Không có dữ liệu'
      : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> ảnh`;
  }

  const controls = bar.querySelector('.pagination-controls');
  if (!controls) return;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  controls.innerHTML = `
    <button class="page-btn" id="pg-prev" ${page <= 1 ? 'disabled' : ''}><i class="ti ti-chevron-left"></i></button>
    ${pages.map(p => p === '...'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" id="pg-next" ${page >= totalPages ? 'disabled' : ''}><i class="ti ti-chevron-right"></i></button>
  `;

  controls.querySelector('#pg-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  controls.querySelector('#pg-next')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderTable(); } });
  controls.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderTable(); });
  });
}

/* ══════════════════════════════════════════════════════════
   UPLOAD MODAL
   ══════════════════════════════════════════════════════════ */
function openUploadModal() {
  pendingFiles = [];
  previewList.innerHTML = '';
  document.getElementById('inp-tag').value = '';
  progressWrap.style.display = 'none';
  progressFill.style.width = '0%';
  btnStartUp.disabled = true;
  uploadModal.classList.add('open');
}
function closeUploadModal() {
  uploadModal.classList.remove('open');
  pendingFiles = [];
  previewList.innerHTML = '';
}

function addFilesToPending(fileList) {
  const MAX_SIZE = 5 * 1024 * 1024;
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_SIZE) { showToast(`${file.name} vượt quá 5MB, bỏ qua.`, true); continue; }
    if (pendingFiles.some(f => f.name === file.name && f.size === file.size)) continue;
    pendingFiles.push(file);
  }
  renderPreviews();
  btnStartUp.disabled = pendingFiles.length === 0;
}

function renderPreviews() {
  previewList.innerHTML = '';
  pendingFiles.forEach((file, idx) => {
    const item = document.createElement('div');
    item.className = 'upload-preview-item';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview';
    removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', () => {
      pendingFiles.splice(idx, 1);
      renderPreviews();
      btnStartUp.disabled = pendingFiles.length === 0;
    });
    item.appendChild(img);
    item.appendChild(removeBtn);
    previewList.appendChild(item);
  });
}

async function startUpload() {
  if (pendingFiles.length === 0) return;
  const tag = document.getElementById('inp-tag').value.trim();
  const totalFiles = pendingFiles.length;

  btnStartUp.disabled = true;
  btnStartUp.innerHTML = '<i class="ti ti-loader ti-spin"></i> Đang upload...';
  btnCancelUp.disabled = true;
  progressWrap.style.display = 'block';

  let doneCount = 0, errorCount = 0;
  for (let i = 0; i < pendingFiles.length; i++) {
    try {
      const { uploadPhotoToCloudinary } = await import('../../controllers/PhotoController.js');
      const uploaded = await uploadPhotoToCloudinary(pendingFiles[i]);
      await addPhoto({
        title: pendingFiles[i].name.replace(/\.[^/.]+$/, ""),
        url: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        tag: tag,
      });
      doneCount++;
    } catch (err) {
      errorCount++;
    }
    const pct = Math.round(((i + 1) / totalFiles) * 100);
    progressText.textContent = `Đang upload ${i + 1}/${totalFiles}...`;
    progressFill.style.width = pct + '%';
  }

  btnStartUp.disabled = false;
  btnStartUp.innerHTML = '<i class="ti ti-upload"></i> Upload tất cả';
  btnCancelUp.disabled = false;

  if (errorCount > 0) {
    showToast(`${doneCount} ảnh thành công, ${errorCount} lỗi.`, true);
  } else {
    showToast(`Upload ${doneCount} ảnh thành công!`);
  }
  closeUploadModal();
  await loadData();
}

/* ══════════════════════════════════════════════════════════
   EDIT MODAL
   ══════════════════════════════════════════════════════════ */
window._editPhoto = (id) => {
  const p = photos.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('edit-preview-img').src = p.url || '';
  document.getElementById('edit-title').value = p.title || '';
  document.getElementById('edit-tag').value = p.tag || '';
  editModal.classList.add('open');
};
function closeEditModal() {
  editModal.classList.remove('open');
  editingId = null;
}

async function saveEdit() {
  if (!editingId) return;
  const payload = {
    title: document.getElementById('edit-title').value.trim(),
    tag: document.getElementById('edit-tag').value.trim(),
  };
  btnSaveEdit.disabled = true;
  btnSaveEdit.innerHTML = '<i class="ti ti-loader ti-spin"></i> Đang lưu...';
  const res = await updatePhoto(editingId, payload);
  btnSaveEdit.disabled = false;
  btnSaveEdit.innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thay đổi';
  if (res.error) { showToast(res.error, true); }
  else { showToast('Cập nhật thành công!'); closeEditModal(); await loadData(); }
}

/* ══════════════════════════════════════════════════════════
   DELETE MODAL
   ══════════════════════════════════════════════════════════ */
window._deletePhoto = (id) => {
  deletingId = id;
  delModal.classList.add('open');
};
function closeDelModal() { deletingId = null; delModal.classList.remove('open'); }

async function confirmDelete() {
  if (!deletingId) return;
  btnConfirmDel.disabled = true;
  btnConfirmDel.innerHTML = '<i class="ti ti-loader ti-spin"></i> Đang xóa...';
  const res = await deletePhoto(deletingId);
  btnConfirmDel.disabled = false;
  btnConfirmDel.textContent = 'Xóa ngay';
  if (res.error) { showToast(res.error, true); }
  else { showToast('Đã xóa ảnh!'); closeDelModal(); await loadData(); }
}

/* ══════════════════════════════════════════════════════════
   LIGHTBOX
   ══════════════════════════════════════════════════════════ */
window._openLightbox = (url) => {
  lightboxImg.src = url;
  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
};
function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 300);
}

/* ══════════════════════════════════════════════════════════
   EVENTS
   ══════════════════════════════════════════════════════════ */
function setupEvents() {
  btnUpload.addEventListener('click', openUploadModal);
  btnCloseUp.addEventListener('click', closeUploadModal);
  btnCancelUp.addEventListener('click', closeUploadModal);
  btnStartUp.addEventListener('click', startUpload);

  // Drop zone
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { addFilesToPending(fileInput.files); fileInput.value = ''; });
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); addFilesToPending(e.dataTransfer.files); });

  // Edit modal
  btnCloseEdit.addEventListener('click', closeEditModal);
  btnCancelEdit.addEventListener('click', closeEditModal);
  btnSaveEdit.addEventListener('click', saveEdit);

  // Delete modal
  btnCancelDel.addEventListener('click', closeDelModal);
  btnConfirmDel.addEventListener('click', confirmDelete);

  // Lightbox
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  // Search & filter
  searchInput.addEventListener('input', (e) => { filterSearch = e.target.value; currentPage = 1; renderTable(); });
  filterTagSel.addEventListener('change', (e) => { filterTag = e.target.value; currentPage = 1; renderTable(); });

  // Sort
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) sortAsc = !sortAsc;
      else { sortCol = col; sortAsc = true; }
      currentPage = 1;
      renderTable();
    });
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    window.location.href = 'Login.html';
  });
}

document.addEventListener('DOMContentLoaded', init);
