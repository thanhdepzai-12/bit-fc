import {
  getAllGalleryItems,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
} from '../../controllers/GalleryController.js';

/* ── STATE ── */
let videos = [];
let sortCol = 'createdAt', sortAsc = false;
let filterCategory = '', filterSearch = '';
let editingId = null, deletingId = null;

/* ── PAGINATION STATE ── */
const PAGE_SIZE = 10;
let currentPage = 1;

/* ── HELPERS ── */
const categoryLabels = {
  Match:    'Trận đấu',
  Training: 'Tập luyện',
  Behind:   'Hậu trường',
  Skills:   'Kỹ năng',
};
const categoryClass = {
  Match:    'role-match',
  Training: 'role-training',
  Behind:   'role-behind',
  Skills:   'role-skills',
};

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError ? 'var(--red-primary)' : 'var(--red-dark)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── GET YOUTUBE THUMBNAIL TỪ ID ──
function getYouTubeThumbnail(id) {
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

/* ── DOM ELEMENTS ── */
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const filterCat = document.getElementById('filter-category');

const formModal = document.getElementById('form-modal');
const btnAdd = document.getElementById('btn-add');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const dataForm = document.getElementById('data-form');
const modalTitle = document.getElementById('modal-title');

const delModal = document.getElementById('delete-modal');
const btnCancelDel = document.getElementById('btn-cancel-del');
const btnConfirmDel = document.getElementById('btn-confirm-del');

const pageInfo = document.getElementById('page-info');

// Auto thumbnail preview logic
const inpVideoId = document.getElementById('inp-videoId');
const thumbnailImg = document.getElementById('thumbnail-img');

inpVideoId.addEventListener('input', () => {
  let vId = inpVideoId.value.trim();

  // Extract pure 11-char Video ID from full YouTube URL (all formats)
  const urlMatch = vId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (urlMatch && urlMatch[1]) {
    vId = urlMatch[1];
  } else {
    // Strip any trailing query params or list params (e.g. '4z2LgRNWifM&list=RD...')
    vId = vId.split('&')[0].split('?')[0].trim();
  }

  // Final safety: keep only valid YouTube ID characters, max 11 chars
  vId = vId.replace(/[^\w-]/g, '').slice(0, 11);

  inpVideoId.value = vId;

  if (vId) {
    thumbnailImg.src = getYouTubeThumbnail(vId);
    thumbnailImg.style.display = 'block';
  } else {
    thumbnailImg.style.display = 'none';
  }
});

/* ── INIT ── */
async function init() {
  await loadData();
  setupEvents();
}

async function loadData() {
  tableBody.innerHTML = `<tr><td colspan="5" class="empty-state"><div class="spinner"></div> Đang tải dữ liệu...</td></tr>`;
  const res = await getAllGalleryItems();
  if (res.error) {
    showToast(res.error, true);
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:var(--red-primary)">Lỗi: ${res.error}</td></tr>`;
    return;
  }
  videos = res;
  renderTable();
}

/* ── RENDER ── */
function getFilteredAndSorted() {
  let arr = [...videos];

  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    arr = arr.filter(v =>
      v.title.toLowerCase().includes(s) ||
      v.videoId.toLowerCase().includes(s)
    );
  }

  if (filterCategory) {
    arr = arr.filter(v => v.category === filterCategory);
  }

  arr.sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

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
  document.getElementById('count-total').textContent = videos.length;

  if (currentData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Không có dữ liệu phù hợp.</td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tableBody.innerHTML = currentData.map(v => {
    const thumbUrl = getYouTubeThumbnail(v.videoId);
    const avatarHtml = v.videoId
      ? `<img src="${thumbUrl}" alt="${v.title}" class="avatar-circle" onerror="this.src='../../assessts/logoBit.png'" />`
      : `<div class="empty-avatar"><i class="ti ti-brand-youtube"></i></div>`;

    const catBadge = v.category
      ? `<span class="role-badge ${categoryClass[v.category] || 'role-match'}">${categoryLabels[v.category] || v.category}</span>`
      : '—';

    return `
      <tr>
        <td style="width: 70px; text-align: center;">${avatarHtml}</td>
        <td>
          <div style="font-weight:600; color:var(--white);">${v.title}</div>
          <div style="font-size:0.75rem; color:var(--gray-mid); margin-top:2px;">${v.tag || 'No tags'}</div>
        </td>
        <td style="font-family: monospace; color: var(--red-primary);">${v.videoId}</td>
        <td>${catBadge}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="editVideo('${v.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
            <button class="btn-icon btn-icon-del" onclick="promptDelete('${v.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPagination(total, currentPage, totalPages);
}

/* ── PAGINATION RENDER ── */
function renderPagination(total, page, totalPages) {
  const bar = document.getElementById('pagination-bar');
  if (!bar) return;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);

  /* Info text */
  const info = bar.querySelector('.pagination-info');
  if (info) {
    info.innerHTML = total === 0
      ? 'Không có dữ liệu'
      : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> video`;
  }

  /* Controls */
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
    <button class="page-btn" id="pg-prev" ${page <= 1 ? 'disabled' : ''} title="Trang trước">
      <i class="ti ti-chevron-left"></i>
    </button>
    ${pages.map(p =>
      p === '...'
        ? `<span class="page-ellipsis">…</span>`
        : `<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" id="pg-next" ${page >= totalPages ? 'disabled' : ''} title="Trang sau">
      <i class="ti ti-chevron-right"></i>
    </button>
  `;

  /* Bind events */
  controls.querySelector('#pg-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  controls.querySelector('#pg-next')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderTable(); } });
  controls.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderTable(); });
  });
}

/* ── FORM LOGIC ── */
function resetForm() {
  editingId = null;
  dataForm.reset();
  modalTitle.textContent = "Thêm Video Highlight";
  thumbnailImg.src = "";
  thumbnailImg.style.display = "none";
}

function openModal() { formModal.classList.add('open'); }
function closeModal() { formModal.classList.remove('open'); resetForm(); }

window.editVideo = (id) => {
  const v = videos.find(x => x.id === id);
  if (!v) return;
  
  editingId = id;
  modalTitle.textContent = "Cập nhật Video";
  
  document.getElementById('inp-title').value = v.title || '';
  document.getElementById('inp-videoId').value = v.videoId || '';
  document.getElementById('inp-category').value = v.category || 'Match';
  document.getElementById('inp-tag').value = v.tag || '';
  
  if (v.videoId) {
    thumbnailImg.src = getYouTubeThumbnail(v.videoId);
    thumbnailImg.style.display = 'block';
  }

  openModal();
};

window.promptDelete = (id) => {
  deletingId = id;
  delModal.classList.add('open');
};
function closeDelModal() {
  deletingId = null;
  delModal.classList.remove('open');
}

/* ── SUBMIT ── */
dataForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const vId = document.getElementById('inp-videoId').value.trim();
  const thumbUrl = getYouTubeThumbnail(vId);

  const payload = {
    title: document.getElementById('inp-title').value,
    videoId: vId,
    thumbnail: thumbUrl,
    category: document.getElementById('inp-category').value,
    tag: document.getElementById('inp-tag').value,
  };

  const btnSave = document.getElementById('btn-save');
  btnSave.disabled = true;
  btnSave.innerHTML = `<i class="ti ti-loader ti-spin"></i> Đang lưu...`;

  let res;
  if (editingId) {
    res = await updateGalleryItem(editingId, payload);
  } else {
    res = await addGalleryItem(payload);
  }

  btnSave.disabled = false;
  btnSave.innerHTML = `<i class="ti ti-device-floppy"></i> Lưu Video`;

  if (res.error) {
    showToast(res.error, true);
  } else {
    showToast(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
    closeModal();
    await loadData();
  }
});

btnConfirmDel.addEventListener('click', async () => {
  if (!deletingId) return;
  const btn = btnConfirmDel;
  btn.disabled = true;
  btn.innerHTML = `<i class="ti ti-loader ti-spin"></i> Đang xóa...`;

  const res = await deleteGalleryItem(deletingId);
  
  btn.disabled = false;
  btn.textContent = "Xóa vĩnh viễn";

  if (res.error) {
    showToast(res.error, true);
  } else {
    showToast("Đã xóa video!");
    closeDelModal();
    await loadData();
  }
});

/* ── EVENTS ── */
function setupEvents() {
  btnAdd.addEventListener('click', () => { resetForm(); openModal(); });
  btnCloseModal.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  btnCancelDel.addEventListener('click', closeDelModal);

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) sortAsc = !sortAsc;
      else { sortCol = col; sortAsc = true; }
      currentPage = 1;
      renderTable();
    });
  });

  searchInput.addEventListener('input', (e) => {
    filterSearch = e.target.value;
    currentPage = 1;
    renderTable();
  });
  
  filterCat.addEventListener('change', (e) => {
    filterCategory = e.target.value;
    currentPage = 1;
    renderTable();
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    window.location.href = 'Login.html';
  });
}

document.addEventListener('DOMContentLoaded', init);