/* ────────────────────────────────────────────
   DATA SEED (từ playersDetailData)
──────────────────────────────────────────── */
// IMPORT TỪ CONTROLLER (bạn nhớ kiểm tra lại đường dẫn tương đối cho đúng với cấu trúc thư mục của mình nhé)
import { getAllPlayers, addPlayer, updatePlayer, deletePlayer } from '../../controllers/PlayerController.js';

/* ── STATE ── */
let players = []; // Khởi tạo mảng rỗng, dữ liệu sẽ được kéo từ Firebase về
let sortCol = 'number', sortAsc = true;
let filterPos = '', filterStatus = '', filterSearch = '';
let editingId = null, deletingId = null;

/* ── PAGINATION STATE (NEW) ── */
const PAGE_SIZE = 10;
let currentPage = 1;

/* ── HELPERS ── */
const posClass  = { GK:'pos-gk', DEF:'pos-def', MID:'pos-mid', FWD:'pos-fwd' };
const posLabels = { GK:'GK', DEF:'DEF', MID:'MID', FWD:'FWD' };
const statusLabel = { active:'Active', injured:'Injured', suspend:'Suspend' };
const statusClass  = { active:'status-active', injured:'status-injured', suspend:'status-suspend' };

function uid() { return 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2,6); }
function initials(name) { return name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase(); }

function toast(msg, type='success') {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<i class="ti ti-${type==='success'?'circle-check':'alert-circle'}"></i>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── RENDER TABLE ── */
function getFiltered() {
  return players.filter(p => {
    if (filterPos    && p.pos    !== filterPos)    return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterSearch && !p.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
}

function renderTable() {
  const tbody = document.getElementById('players-tbody');
  const filtered = getFiltered();
  const total = filtered.length;

  /* Clamp currentPage */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  /* Slice for current page */
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  /* Update count bar */
  document.getElementById('count-shown').textContent = total;
  document.getElementById('count-total').textContent = players.length;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><i class="ti ti-users-off"></i>Không tìm thấy cầu thủ nào</div></td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tbody.innerHTML = pageItems.map(p => `
    <tr>
      <td class="col-num"><div class="jersey-num">${p.number}</div></td>
      <td class="col-player">
        <div class="player-cell">
          <img class="player-avatar" src="${p.img}" alt="${p.name}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
               loading="lazy" />
          <div class="player-avatar-fallback" style="display:none">${initials(p.name)}</div>
          <div>
            <div class="player-name-text">${p.name}</div>
            <div class="player-joined">Gia nhập ${p.joined}</div>
          </div>
        </div>
      </td>
      <td class="col-pos"><span class="pos-badge ${posClass[p.pos] || 'pos-mid'}">${posLabels[p.pos] || p.pos}</span></td>
      <td class="col-nat">${p.nationality || '—'}</td>
      <td class="col-stats"><span class="stat-cell">${p.goals ?? 0}</span></td>
      <td class="col-stats"><span class="stat-cell">${p.assists ?? 0}</span></td>
      <td class="col-stats"><span class="stat-cell">${p.appearances ?? 0}</span></td>
      <td class="col-status"><span class="status-badge ${statusClass[p.status] || 'status-active'}">${statusLabel[p.status] || 'Active'}</span></td>
      <td class="col-action">
        <div class="action-btns">
          <button class="act-btn act-edit" onclick="openEdit('${p.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
          <button class="act-btn act-del"  onclick="openDelete('${p.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination(total, currentPage, totalPages);
}

/* ── PAGINATION RENDER (NEW) ── */
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
      : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> cầu thủ`;
  }

  /* Controls */
  const controls = bar.querySelector('.pagination-controls');
  if (!controls) return;

  /* Build page numbers with ellipsis */
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

/* ── SORT ── */
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortCol === col) sortAsc = !sortAsc;
    else { sortCol = col; sortAsc = true; }
    document.querySelectorAll('th.sortable').forEach(t => t.classList.remove('sort-asc','sort-desc'));
    th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
    currentPage = 1; /* Reset to page 1 on sort */
    renderTable();
  });
});

/* ── FILTERS ── */
document.getElementById('search-input').addEventListener('input', e => { filterSearch = e.target.value; currentPage = 1; renderTable(); });
document.getElementById('filter-pos').addEventListener('change', e => { filterPos = e.target.value; currentPage = 1; renderTable(); });
document.getElementById('filter-status').addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; renderTable(); });

/* ── FORM MODAL ── */
window.openAdd = function() {
  editingId = null;
  avatarBase64 = null;                          
  document.getElementById('form-modal-title').innerHTML = 'Thêm <span>Cầu Thủ</span>';
  document.getElementById('form-save-btn').textContent = 'Thêm cầu thủ';
  ['name','number','pos','nat','birth','joined','height','weight','img','apps','goals','assists','cards','bio'].forEach(id => {
    const el = document.getElementById('f-'+id);
    if (el) el.value = '';
  });
  document.getElementById('f-status').value = 'active';
  resetAvatarPreview();                         
  document.getElementById('form-modal').classList.add('open');
}

window.openEdit = function(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  avatarBase64 = null;                          
  document.getElementById('form-modal-title').innerHTML = 'Sửa <span>Cầu Thủ</span>';
  document.getElementById('form-save-btn').textContent = 'Lưu thay đổi';
  document.getElementById('f-name').value    = p.name || '';
  document.getElementById('f-number').value  = p.number || '';
  document.getElementById('f-pos').value     = p.pos || '';
  document.getElementById('f-nat').value     = p.nationality || '';
  document.getElementById('f-birth').value   = p.birth || '';
  document.getElementById('f-joined').value  = p.joined || '';
  document.getElementById('f-height').value  = p.height || '';
  document.getElementById('f-weight').value  = p.weight || '';
  document.getElementById('f-img').value     = p.img || '';
  document.getElementById('f-status').value  = p.status || 'active';
  document.getElementById('f-apps').value    = p.appearances || 0;
  document.getElementById('f-goals').value   = p.goals || 0;
  document.getElementById('f-assists').value = p.assists || 0;
  document.getElementById('f-cards').value   = p.cards || '';
  document.getElementById('f-bio').value     = p.bio || '';
  if (p.img) showAvatarPreview(p.img);
  else resetAvatarPreview();                    
  document.getElementById('form-modal').classList.add('open');
}

function closeFormModal() { document.getElementById('form-modal').classList.remove('open'); }

document.getElementById('btn-add-player').addEventListener('click', openAdd);
document.getElementById('form-modal-close').addEventListener('click', closeFormModal);
document.getElementById('form-cancel-btn').addEventListener('click', closeFormModal);
document.getElementById('form-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeFormModal(); });

/* ── UPDATE 1: SỰ KIỆN LƯU GỌI API FIREBASE ── */
document.getElementById('form-save-btn').addEventListener('click', async () => {
  const name   = document.getElementById('f-name').value.trim();
  const number = parseInt(document.getElementById('f-number').value) || 0;
  const pos    = document.getElementById('f-pos').value;
  if (!name || !pos) { toast('Vui lòng điền đầy đủ tên và vị trí', 'error'); return; }

  // Map lại object theo chuẩn của PlayerController
  const data = {
    name, number, pos,
    posLabel: document.getElementById('f-pos').options[document.getElementById('f-pos').selectedIndex]?.text || pos,
    nationality: document.getElementById('f-nat').value.trim(),
    birth:   document.getElementById('f-birth').value.trim(),
    joined:  parseInt(document.getElementById('f-joined').value) || new Date().getFullYear(),
    height:  document.getElementById('f-height').value.trim(),
    weight:  document.getElementById('f-weight').value.trim(),
    imgUrl:  document.getElementById('f-img').value.trim(), // Đổi thành imgUrl cho khớp DB
    status:  document.getElementById('f-status').value,
    appearances: parseInt(document.getElementById('f-apps').value) || 0,
    goals:   parseInt(document.getElementById('f-goals').value) || 0,
    assists: parseInt(document.getElementById('f-assists').value) || 0,
    cards:   document.getElementById('f-cards').value.trim(),
    bio:     document.getElementById('f-bio').value.trim(),
  };

  // Khóa nút trong lúc upload
  const btn = document.getElementById('form-save-btn');
  const originalText = btn.innerHTML;
  btn.textContent = 'Đang xử lý...';
  btn.style.pointerEvents = 'none';

  try {
    if (editingId) {
      const res = await updatePlayer(editingId, data, avatarBase64);
      if (res.error) throw new Error(res.error);
      toast(`Đã cập nhật ${name}`);
    } else {
      const res = await addPlayer(data, avatarBase64);
      if (res.error) throw new Error(res.error);
      toast(`Đã thêm ${name}`);
    }
    closeFormModal();
    await loadPlayers(); // Tải lại danh sách sau khi lưu
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.style.pointerEvents = 'auto';
  }
});

/* ── AVATAR UPLOAD ── */
let avatarBase64 = null;

const avatarDropZone   = document.getElementById('avatar-drop-zone');
const avatarFileInput  = document.getElementById('avatar-file-input');
const avatarPreviewImg = document.getElementById('avatar-preview-img');
const avatarPlaceholder= document.getElementById('avatar-placeholder');
const avatarActions    = document.getElementById('avatar-actions');
const avatarPreviewWrap= document.getElementById('avatar-preview-wrap');

avatarPreviewWrap.addEventListener('click', () => {
  if (!avatarPreviewImg.src || avatarPreviewImg.style.display === 'none') avatarFileInput.click();
});
document.getElementById('avatar-change-btn').addEventListener('click', () => avatarFileInput.click());
document.getElementById('avatar-remove-btn').addEventListener('click', () => {
  resetAvatarPreview();
  avatarBase64 = null;
  document.getElementById('f-img').value = '';
});

avatarFileInput.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 500 * 1024) {
    const sizeInfo = document.getElementById('avatar-size-info');
    sizeInfo.textContent = `⚠ File quá lớn (${(file.size/1024).toFixed(0)} KB). Tối đa 500KB.`;
    sizeInfo.className = 'avatar-size-info error';
    return;
  }
  readAvatarAsBase64(file);
});

avatarDropZone.addEventListener('dragover', e => { e.preventDefault(); avatarDropZone.classList.add('dragover'); });
avatarDropZone.addEventListener('dragleave', () => avatarDropZone.classList.remove('dragover'));
avatarDropZone.addEventListener('drop', e => {
  e.preventDefault(); avatarDropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) { toast('Vui lòng chọn file ảnh', 'error'); return; }
  if (file.size > 500 * 1024) { toast('Ảnh tối đa 500KB', 'error'); return; }
  readAvatarAsBase64(file);
});

function readAvatarAsBase64(file) {
  const sizeInfo = document.getElementById('avatar-size-info');
  sizeInfo.textContent = `${(file.size/1024).toFixed(0)} KB`;
  sizeInfo.className = 'avatar-size-info ok';
  const reader = new FileReader();
  reader.onload = e => {
    avatarBase64 = e.target.result;
    showAvatarPreview(avatarBase64);
    document.getElementById('f-img').value = '';   // xóa URL cũ nếu có
  };
  reader.readAsDataURL(file);
}

function showAvatarPreview(src) {
  avatarPreviewImg.src            = src;
  avatarPreviewImg.style.display  = 'block';
  avatarPlaceholder.style.display = 'none';
  avatarActions.style.display     = 'flex';
}

function resetAvatarPreview() {
  avatarPreviewImg.src            = '';
  avatarPreviewImg.style.display  = 'none';
  avatarPlaceholder.style.display = 'flex';
  avatarActions.style.display     = 'none';
  avatarFileInput.value           = '';
  const sizeInfo = document.getElementById('avatar-size-info');
  if (sizeInfo) { sizeInfo.textContent = ''; sizeInfo.className = 'avatar-size-info'; }
}

// URL ngoài → preview ngay
document.getElementById('f-img').addEventListener('input', e => {
  const url = e.target.value.trim();
  if (url) { showAvatarPreview(url); avatarBase64 = null; }
  else if (!avatarBase64) resetAvatarPreview();
});

/* ── DELETE MODAL ── */
window.openDelete = function(id) {
  deletingId = id;
  const p = players.find(x => x.id === id);
  document.getElementById('delete-player-name').textContent = p ? p.name : '?';
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() { document.getElementById('delete-modal').classList.remove('open'); }

document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
document.getElementById('delete-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteModal(); });

/* ── UPDATE 2: SỰ KIỆN XÓA GỌI API FIREBASE ── */
document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
  const p = players.find(x => x.id === deletingId);
  const btn = document.getElementById('delete-confirm-btn');
  const originalText = btn.textContent;
  
  btn.textContent = 'Đang xóa...';
  btn.style.pointerEvents = 'none';

  try {
    const res = await deletePlayer(deletingId);
    if (res.error) throw new Error(res.error);
    toast(`Đã xóa ${p?.name || 'cầu thủ'}`, 'error'); // Vẫn giữ toast style error như cũ của bạn
    closeDeleteModal();
    await loadPlayers(); // Tải lại danh sách
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.textContent = originalText;
    btn.style.pointerEvents = 'auto';
  }
});

/* ── HAMBURGER ── */
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('sidebar-overlay');
const hamburger = document.getElementById('hamburger-btn');

hamburger.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  overlay.classList.toggle('visible', open);
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  hamburger.classList.remove('open');
  overlay.classList.remove('visible');
});

/* ── DATE ── */
const d = new Date();
document.getElementById('current-date').textContent =
  d.toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

/* ── UPDATE 3: INIT & TẢI DỮ LIỆU TỪ FIREBASE ── */
async function loadPlayers() {
  const res = await getAllPlayers();
  if (res.error) {
    toast(res.error, 'error');
  } else {
    // Map trường imgUrl (từ DB) thành trường img (để giữ nguyên 100% logic renderTable cũ của bạn)
    players = res.map(p => ({ ...p, img: p.imgUrl })); 
    renderTable();
  }
}

// Khởi chạy
loadPlayers();