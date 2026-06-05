import { getAllStaffs, addStaff, updateStaff, deleteStaff } from '../../controllers/StaffController.js';

/* ── STATE ── */
let staffs = [];
let sortCol = 'name', sortAsc = true;
let filterRole = '', filterStatus = '', filterSearch = '';
let editingId = null, deletingId = null;

/* ── PAGINATION STATE ── */
const PAGE_SIZE = 10;
let currentPage = 1;

/* ── HELPERS ── */
const roleLabels = {
  HLV_TRUONG:  'HLV Trưởng',
  HLV_THU_MON: 'HLV Thủ Môn',
  TRO_LY_HLV:  'Trợ lý HLV',
  BAC_SI:      'Bác sĩ / Y tế',
  QUAN_LY:     'Quản lý đội',
};
const roleClass = {
  HLV_TRUONG:  'role-head',
  HLV_THU_MON: 'role-gk',
  TRO_LY_HLV:  'role-asst',
  BAC_SI:      'role-med',
  QUAN_LY:     'role-mgr',
};
const statusLabel = { active: 'Active', inactive: 'Inactive' };
const statusClass  = { active: 'status-active', inactive: 'status-inactive' };

function initials(name) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
}

function toast(msg, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<i class="ti ti-${type === 'success' ? 'circle-check' : 'alert-circle'}"></i>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── RENDER TABLE ── */
function getFiltered() {
  return staffs.filter(s => {
    if (filterRole   && s.role   !== filterRole)   return false;
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterSearch && !s.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
}

function renderTable() {
  const tbody = document.getElementById('staff-tbody');
  const filtered = getFiltered();
  const total = filtered.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  document.getElementById('count-shown').textContent = total;
  document.getElementById('count-total').textContent = staffs.length;

  if (!total) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><i class="ti ti-users-off"></i>Không tìm thấy thành viên nào</div></td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tbody.innerHTML = pageItems.map(s => `
    <tr>
      <td class="col-avatar">
        <div class="staff-avatar-wrap">
          <img class="staff-avatar" src="${s.img || ''}" alt="${s.name}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
               loading="lazy" ${s.img ? '' : 'style="display:none"'} />
          <div class="staff-avatar-fallback" ${s.img ? 'style="display:none"' : ''}>${initials(s.name)}</div>
        </div>
      </td>
      <td class="col-name">
        <div class="staff-name-text">${s.name}</div>
        <div class="staff-joined-text">Gia nhập ${s.joined || '—'}</div>
      </td>
      <td class="col-role">
        <span class="role-badge ${roleClass[s.role] || 'role-mgr'}">${roleLabels[s.role] || s.role || '—'}</span>
      </td>
      <td class="col-nat">${s.nationality || '—'}</td>
      <td class="col-joined">${s.joined || '—'}</td>
      <td class="col-phone">${s.phone || '—'}</td>
      <td class="col-status">
        <span class="status-badge ${statusClass[s.status] || 'status-active'}">${statusLabel[s.status] || 'Active'}</span>
      </td>
      <td class="col-action">
        <div class="action-btns">
          <button class="act-btn act-edit" onclick="openEdit('${s.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
          <button class="act-btn act-del"  onclick="openDelete('${s.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination(total, currentPage, totalPages);
}

/* ── PAGINATION ── */
function renderPagination(total, page, totalPages) {
  const bar = document.getElementById('pagination-bar');
  if (!bar) return;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);

  const info = bar.querySelector('.pagination-info');
  if (info) {
    info.innerHTML = total === 0
      ? 'Không có dữ liệu'
      : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> thành viên`;
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
    document.querySelectorAll('th.sortable').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
    currentPage = 1;
    renderTable();
  });
});

/* ── FILTERS ── */
document.getElementById('search-input').addEventListener('input', e => { filterSearch = e.target.value; currentPage = 1; renderTable(); });
document.getElementById('filter-role').addEventListener('change', e => { filterRole = e.target.value; currentPage = 1; renderTable(); });
document.getElementById('filter-status').addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; renderTable(); });

/* ── FORM MODAL ── */
window.openAdd = function () {
  editingId = null;
  avatarBase64 = null;
  document.getElementById('form-modal-title').innerHTML = 'Thêm <span>Thành Viên</span>';
  document.getElementById('form-save-btn').innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thành viên';
  ['name', 'role', 'nat', 'birth', 'joined', 'phone', 'email', 'bio', 'img'].forEach(id => {
    const el = document.getElementById('f-' + id);
    if (el) el.value = '';
  });
  setStatusToggle('active');
  resetAvatarPreview();
  document.getElementById('form-modal').classList.add('open');
};

window.openEdit = function (id) {
  const s = staffs.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  avatarBase64 = null;
  document.getElementById('form-modal-title').innerHTML = 'Sửa <span>Thành Viên</span>';
  document.getElementById('form-save-btn').innerHTML = '<i class="ti ti-device-floppy"></i> Cập nhật';
  document.getElementById('f-name').value    = s.name    || '';
  document.getElementById('f-role').value    = s.role    || '';
  document.getElementById('f-nat').value     = s.nationality || '';
  document.getElementById('f-birth').value   = s.birth   || '';
  document.getElementById('f-joined').value  = s.joined  || '';
  document.getElementById('f-phone').value   = s.phone   || '';
  document.getElementById('f-email').value   = s.email   || '';
  document.getElementById('f-bio').value     = s.bio     || '';
  document.getElementById('f-img').value     = s.imgUrl  || '';
  setStatusToggle(s.status || 'active');
  if (s.img) showAvatarPreview(s.img);
  else resetAvatarPreview();
  document.getElementById('form-modal').classList.add('open');
};

function closeFormModal() {
  document.getElementById('form-modal').classList.remove('open');
}

document.getElementById('form-modal-close').addEventListener('click', closeFormModal);
document.getElementById('form-cancel-btn').addEventListener('click', closeFormModal);
document.getElementById('form-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeFormModal(); });
document.getElementById('btn-add-staff').addEventListener('click', () => window.openAdd());

/* ── STATUS TOGGLE ── */
function setStatusToggle(val) {
  document.getElementById('f-status').value = val;
  document.getElementById('status-active-btn').classList.toggle('active', val === 'active');
  document.getElementById('status-inactive-btn').classList.toggle('active', val === 'inactive');
}
document.getElementById('status-active-btn').addEventListener('click', () => setStatusToggle('active'));
document.getElementById('status-inactive-btn').addEventListener('click', () => setStatusToggle('inactive'));

/* ── SAVE ── */
document.getElementById('form-save-btn').addEventListener('click', async () => {
  const name = document.getElementById('f-name').value.trim();
  const role  = document.getElementById('f-role').value;
  if (!name || !role) { toast('Vui lòng điền đầy đủ tên và vai trò', 'error'); return; }

  const data = {
    name,
    role,
    roleLabel: document.getElementById('f-role').options[document.getElementById('f-role').selectedIndex]?.text || role,
    nationality: document.getElementById('f-nat').value.trim(),
    birth:   document.getElementById('f-birth').value.trim(),
    joined:  parseInt(document.getElementById('f-joined').value) || new Date().getFullYear(),
    phone:   document.getElementById('f-phone').value.trim(),
    email:   document.getElementById('f-email').value.trim(),
    bio:     document.getElementById('f-bio').value.trim(),
    imgUrl:  document.getElementById('f-img').value.trim(),
    status:  document.getElementById('f-status').value,
  };

  const btn = document.getElementById('form-save-btn');
  const originalHTML = btn.innerHTML;
  btn.textContent = 'Đang xử lý...';
  btn.style.pointerEvents = 'none';

  try {
    if (editingId) {
      const res = await updateStaff(editingId, data, avatarBase64);
      if (res.error) throw new Error(res.error);
      toast(`Đã cập nhật ${name}`);
    } else {
      const res = await addStaff(data, avatarBase64);
      if (res.error) throw new Error(res.error);
      toast(`Đã thêm ${name}`);
    }
    closeFormModal();
    await loadStaffs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.innerHTML = originalHTML;
    btn.style.pointerEvents = 'auto';
  }
});

/* ── AVATAR UPLOAD ── */
let avatarBase64 = null;

const avatarDropZone    = document.getElementById('avatar-drop-zone');
const avatarFileInput   = document.getElementById('avatar-file-input');
const avatarPreviewImg  = document.getElementById('avatar-preview-img');
const avatarPlaceholder = document.getElementById('avatar-placeholder');
const avatarActions     = document.getElementById('avatar-actions');
const avatarPreviewWrap = document.getElementById('avatar-preview-wrap');

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
    sizeInfo.textContent = `⚠ File quá lớn (${(file.size / 1024).toFixed(0)} KB). Tối đa 500KB.`;
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
  sizeInfo.textContent = `${(file.size / 1024).toFixed(0)} KB`;
  sizeInfo.className = 'avatar-size-info ok';
  const reader = new FileReader();
  reader.onload = e => {
    avatarBase64 = e.target.result;
    showAvatarPreview(avatarBase64);
    document.getElementById('f-img').value = '';
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

document.getElementById('f-img').addEventListener('input', e => {
  const url = e.target.value.trim();
  if (url) { showAvatarPreview(url); avatarBase64 = null; }
  else if (!avatarBase64) resetAvatarPreview();
});

/* ── DELETE MODAL ── */
window.openDelete = function (id) {
  deletingId = id;
  const s = staffs.find(x => x.id === id);
  document.getElementById('delete-staff-name').textContent = s ? s.name : '?';
  document.getElementById('delete-modal').classList.add('open');
};

function closeDeleteModal() { document.getElementById('delete-modal').classList.remove('open'); }

document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
document.getElementById('delete-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteModal(); });

document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
  const s = staffs.find(x => x.id === deletingId);
  const btn = document.getElementById('delete-confirm-btn');
  const originalText = btn.textContent;

  btn.textContent = 'Đang xóa...';
  btn.style.pointerEvents = 'none';

  try {
    const res = await deleteStaff(deletingId);
    if (res.error) throw new Error(res.error);
    toast(`Đã xóa ${s?.name || 'thành viên'}`, 'error');
    closeDeleteModal();
    await loadStaffs();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.textContent = originalText;
    btn.style.pointerEvents = 'auto';
  }
});

/* ── HAMBURGER ── */
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('sidebar-overlay');
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
  d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ── LOAD DATA ── */
async function loadStaffs() {
  const res = await getAllStaffs();
  if (res.error) {
    toast(res.error, 'error');
  } else {
    staffs = res.map(s => ({ ...s, img: s.imgUrl }));
    renderTable();
  }
}

loadStaffs();