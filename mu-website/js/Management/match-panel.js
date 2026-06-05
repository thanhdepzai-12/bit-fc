import {
  getAllMatches,
  addMatch,
  updateMatch,
  deleteMatch
} from "../../controllers/MatchController.js";
import { getAllPlayers } from "../../controllers/PlayerController.js";

// ─── STATE ────────────────────────────────────────────────
let allMatches  = [];
let filteredData = [];
let allPlayers  = [];
let filterComp  = "", filterType = "", filterSearch = "";
let editingId   = null, deletingId = null;
let homeBase64  = null, awayBase64 = null;
const PAGE_SIZE = 9; // Grid: 3x3
let currentPage = 1;

// Đếm số lượng
let remarkCount = 0;
let publicCount = 0;

// ─── DOM ──────────────────────────────────────────────────
const grid         = document.getElementById("match-grid");
const searchInput  = document.getElementById("search-input");
const filterCompEl = document.getElementById("filter-comp");
const filterTypeEl = document.getElementById("filter-type");
const pgBar        = document.getElementById("pagination-bar");
const scorerList   = document.getElementById("scorer-list");

// ─── INIT ─────────────────────────────────────────────────
async function init() {
  setDate();
  await loadPlayers();
  await loadMatches();
}

async function loadPlayers() {
  const result = await getAllPlayers();
  if (result.error) { toast("Lỗi lấy danh sách cầu thủ", "error"); return; }
  allPlayers = result.sort((a,b) => (a.number||0) - (b.number||0));
}

async function loadMatches() {
  const result = await getAllMatches();
  if (result.error) { toast(result.error, "error"); return; }
  allMatches = result;
  applyFilters();
}

// ─── DATE ─────────────────────────────────────────────────
function setDate() {
  const el = document.getElementById("current-date");
  if (el) el.textContent = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── FILTER ───────────────────────────────────────────────
function applyFilters() {
  remarkCount = allMatches.filter(m => m.isRemark).length;
  publicCount = allMatches.filter(m => m.isPublic).length;

  document.getElementById("count-remark").textContent = remarkCount;
  document.getElementById("count-public").textContent = publicCount;

  filteredData = allMatches.filter(m => {
    if (filterComp && m.comp !== filterComp) return false;
    if (filterType === "remark" && !m.isRemark) return false;
    if (filterType === "public" && !m.isPublic) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!m.home.toLowerCase().includes(q) && !m.away.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  currentPage = 1;
  renderGrid();
}

// ─── RENDER GRID ──────────────────────────────────────────
function renderGrid() {
  const total      = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filteredData.slice(start, start + PAGE_SIZE);

  document.getElementById("count-shown").textContent  = total;
  document.getElementById("count-total").textContent  = allMatches.length;

  if (!total) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--gray-mid); font-family:var(--font-condensed);">
      <i class="ti ti-calendar-off" style="font-size:36px; display:block; margin-bottom:10px; color:rgba(218,41,28,0.3)"></i>
      KHÔNG CÓ TRẬN ĐẤU NÀO
    </div>`;
    renderPagination(0, 1, 1);
    return;
  }

  grid.innerHTML = items.map(m => {
    const dStr = (m.time ? m.time + " - " : "") + (m.date ? formatDateString(m.date) : "Chưa định ngày");
    let resColor = "rgba(255,255,255,0.1)";
    if (m.result === "w") resColor = "rgba(34,197,94,0.3)";
    if (m.result === "d") resColor = "rgba(251,225,34,0.3)";
    if (m.result === "l") resColor = "rgba(218,41,28,0.3)";

    return `
    <div class="match-card">
      <div class="mc-header">
        <span class="mc-comp">${m.comp}</span>
        <span class="mc-date">${dStr}</span>
      </div>
      <div class="mc-body">
        <div class="mc-team">
          <div class="mc-logo">
            ${m.homeLogo ? `<img src="${m.homeLogo}" alt="${m.homeShort}">` : `<span>${m.homeShort}</span>`}
          </div>
          <div class="mc-tname">${m.home}</div>
        </div>
        <div class="mc-score" style="border-color:${resColor}">${m.score || "-"}</div>
        <div class="mc-team">
          <div class="mc-logo">
            ${m.awayLogo ? `<img src="${m.awayLogo}" alt="${m.awayShort}">` : `<span>${m.awayShort}</span>`}
          </div>
          <div class="mc-tname">${m.away}</div>
        </div>
      </div>
      <div class="mc-footer">
        <div class="mc-badges">
          ${m.isRemark ? `<span class="mc-badge remark"><i class="ti ti-star-filled"></i> Remark</span>` : ""}
          ${m.isPublic ? `<span class="mc-badge public"><i class="ti ti-eye"></i> Public</span>` : ""}
        </div>
        <div class="mc-actions">
          <button class="act-btn act-edit" onclick="openEdit('${m.id}')" title="Sửa"><i class="ti ti-pencil"></i></button>
          <button class="act-btn act-del" onclick="openDelete('${m.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join("");

  renderPagination(total, currentPage, totalPages);
}

// ─── PAGINATION ───────────────────────────────────────────
function renderPagination(total, page, totalPages) {
  if (!pgBar) return;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  const info  = pgBar.querySelector(".pagination-info");
  if (info) info.innerHTML = total === 0 ? "Không có dữ liệu" : `Hiển thị <strong>${start}–${end}</strong> / <strong>${total}</strong> trận`;

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
  ctrl.querySelector("#pg-prev")?.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderGrid(); }});
  ctrl.querySelector("#pg-next")?.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; renderGrid(); }});
  ctrl.querySelectorAll(".page-btn[data-page]").forEach(btn => btn.addEventListener("click", () => { currentPage = +btn.dataset.page; renderGrid(); }));
}

// ─── FILTERS ──────────────────────────────────────────────
searchInput.addEventListener("input",  e => { filterSearch = e.target.value; applyFilters(); });
filterCompEl.addEventListener("change", e => { filterComp = e.target.value; applyFilters(); });
filterTypeEl.addEventListener("change", e => { filterType = e.target.value; applyFilters(); });

// ─── LIMIT CHECKBOXES ─────────────────────────────────────
const chkRemark = document.getElementById("f-remark");
const chkPublic = document.getElementById("f-public");

function updateCheckboxLimits() {
  // Đếm theo dữ liệu đang có. Nhưng nếu đang Edit trận hiện tại,
  // trận đó đã chiếm slot thì không tính là đã full đối với chính nó.
  let isEditingRemark = false;
  let isEditingPublic = false;
  if (editingId) {
    const a = allMatches.find(x => x.id === editingId);
    if (a?.isRemark) isEditingRemark = true;
    if (a?.isPublic) isEditingPublic = true;
  }

  const currR = remarkCount - (isEditingRemark ? 1 : 0);
  const currP = publicCount - (isEditingPublic ? 1 : 0);

  if (currR >= 1 && !chkRemark.checked) {
    chkRemark.disabled = true;
    chkRemark.parentElement.style.opacity = 0.5;
    chkRemark.parentElement.title = "Đã đạt giới hạn 1 trận Nổi bật";
  } else {
    chkRemark.disabled = false;
    chkRemark.parentElement.style.opacity = 1;
    chkRemark.parentElement.title = "";
  }

  if (currP >= 2 && !chkPublic.checked) {
    chkPublic.disabled = true;
    chkPublic.parentElement.style.opacity = 0.5;
    chkPublic.parentElement.title = "Đã đạt giới hạn 2 trận Public";
  } else {
    chkPublic.disabled = false;
    chkPublic.parentElement.style.opacity = 1;
    chkPublic.parentElement.title = "";
  }
}

chkRemark.addEventListener("change", updateCheckboxLimits);
chkPublic.addEventListener("change", updateCheckboxLimits);

// ─── SCORERS DYNAMIC LIST ─────────────────────────────────
document.getElementById("btn-add-scorer").addEventListener("click", () => {
  addScorerRow();
});

function addScorerRow(playerId = "", goals = 1) {
  const row = document.createElement("div");
  row.className = "scorer-item";

  let options = `<option value="">-- Chọn cầu thủ --</option>`;
  allPlayers.forEach(p => {
    const sel = p.id === playerId ? "selected" : "";
    options += `<option value="${p.id}" ${sel}>#${p.number} - ${p.name}</option>`;
  });

  row.innerHTML = `
    <select class="form-select scorer-id">${options}</select>
    <input type="number" class="form-input scorer-goals" value="${goals}" min="1" />
    <button type="button" class="scorer-remove" title="Xóa"><i class="ti ti-x"></i></button>
  `;
  row.querySelector(".scorer-remove").addEventListener("click", () => row.remove());
  scorerList.appendChild(row);
}

function getScorersData() {
  const arr = [];
  scorerList.querySelectorAll(".scorer-item").forEach(row => {
    const id = row.querySelector(".scorer-id").value;
    const g  = parseInt(row.querySelector(".scorer-goals").value) || 0;
    if (id && g > 0) {
      arr.push({ playerId: id, goals: g });
    }
  });
  return arr;
}

function updateDateDisplay(val) {
  const fDate = document.getElementById("f-date");
  if (!fDate) return;
  fDate.value = val || "";
  if (!val) {
    fDate.setAttribute("data-date", "dd/mm/yyyy");
    return;
  }
  const parts = val.split('-');
  if (parts.length === 3) {
    fDate.setAttribute("data-date", `${parts[2]}/${parts[1]}/${parts[0]}`);
  } else {
    fDate.setAttribute("data-date", val);
  }
}

document.getElementById("f-date").addEventListener("input", e => {
  updateDateDisplay(e.target.value);
});

// ─── FORM MODAL ───────────────────────────────────────────
function resetForm() {
  document.getElementById("f-home").value = "BIT FC";
  document.getElementById("f-home-short").value = "BIT";
  document.getElementById("f-away").value = "";
  document.getElementById("f-away-short").value = "";
  document.getElementById("f-comp").value = "Giao Hữu";
  document.getElementById("f-venue").value = "Sân ABC";
  document.getElementById("f-time").value = "15:30";
  document.getElementById("f-score").value = "";
  document.getElementById("f-result").value = "none";
  chkRemark.checked = false;
  chkPublic.checked = false;

  updateDateDisplay("");
  scorerList.innerHTML = "";
  
  resetLogoPreview("home");
  resetLogoPreview("away");
  updateCheckboxLimits();
}

function openFormModal(title) {
  document.getElementById("form-modal-title").innerHTML = title;
  document.getElementById("form-modal").classList.add("open");
}

function closeFormModal() {
  document.getElementById("form-modal").classList.remove("open");
  editingId = null; 
  homeBase64 = null; awayBase64 = null;
}

document.getElementById("btn-add-match").addEventListener("click", () => {
  editingId = null;
  resetForm();
  document.getElementById("form-modal-title").innerHTML = 'Thêm <span>Trận Đấu</span>';
  document.getElementById("form-save-btn").innerHTML = '<i class="ti ti-device-floppy"></i> Thêm trận đấu';
  openFormModal('Thêm <span>Trận Đấu</span>');
});

window.openEdit = (id) => {
  const a = allMatches.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  
  document.getElementById("f-home").value = a.home || "";
  document.getElementById("f-home-short").value = a.homeShort || "";
  document.getElementById("f-away").value = a.away || "";
  document.getElementById("f-away-short").value = a.awayShort || "";
  document.getElementById("f-comp").value = a.comp || "Giao Hữu";
  document.getElementById("f-venue").value = a.venue || "";
  updateDateDisplay(a.date || "");
  document.getElementById("f-time").value = a.time || "";
  document.getElementById("f-score").value = a.score || "";
  document.getElementById("f-result").value = a.result || "none";
  
  chkRemark.checked = !!a.isRemark;
  chkPublic.checked = !!a.isPublic;
  
  scorerList.innerHTML = "";
  if (a.scorers && a.scorers.length) {
    a.scorers.forEach(s => addScorerRow(s.playerId, s.goals));
  }

  homeBase64 = null; awayBase64 = null;
  if (a.homeLogo) showLogoPreview("home", a.homeLogo);
  else resetLogoPreview("home");

  if (a.awayLogo) showLogoPreview("away", a.awayLogo);
  else resetLogoPreview("away");

  updateCheckboxLimits();

  document.getElementById("form-modal-title").innerHTML = 'Sửa <span>Trận Đấu</span>';
  document.getElementById("form-save-btn").innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thay đổi';
  openFormModal('Sửa <span>Trận Đấu</span>');
};

document.getElementById("form-modal-close").addEventListener("click", closeFormModal);
document.getElementById("form-cancel-btn").addEventListener("click", closeFormModal);
document.getElementById("form-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeFormModal(); });

// SAVE
document.getElementById("form-save-btn").addEventListener("click", async () => {
  const home = document.getElementById("f-home").value.trim();
  const away = document.getElementById("f-away").value.trim();
  
  if (!home) { toast("Vui lòng nhập tên Đội nhà", "error"); return; }
  if (!away) { toast("Vui lòng nhập tên Đội khách", "error"); return; }

  const data = {
    home,
    homeShort: document.getElementById("f-home-short").value.trim(),
    away,
    awayShort: document.getElementById("f-away-short").value.trim(),
    comp:      document.getElementById("f-comp").value,
    venue:     document.getElementById("f-venue").value.trim(),
    date:      document.getElementById("f-date").value,
    time:      document.getElementById("f-time").value,
    score:     document.getElementById("f-score").value.trim(),
    result:    document.getElementById("f-result").value,
    isRemark:  chkRemark.checked,
    isPublic:  chkPublic.checked,
    scorers:   getScorersData()
  };

  const btn = document.getElementById("form-save-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader"></i> Đang lưu...';

  let result;
  if (editingId) {
    result = await updateMatch(editingId, data, homeBase64, awayBase64);
    if (!result.error) {
      const idx = allMatches.findIndex(a => a.id === editingId);
      if (idx !== -1) allMatches[idx] = { ...allMatches[idx], ...result };
      toast(`Đã cập nhật trận đấu`);
    }
  } else {
    result = await addMatch(data, homeBase64, awayBase64);
    if (!result.error) {
      allMatches.unshift({ ...data, ...result });
      toast(`Đã thêm trận đấu`);
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-device-floppy"></i> Lưu trận đấu';

  if (result.error) { toast(result.error, "error"); return; }
  closeFormModal();
  applyFilters();
});

// ─── LOGO UPLOAD ──────────────────────────────────────────
function setupLogoUpload(type) {
  const wrap   = document.getElementById(`${type}-logo-wrap`);
  const input  = document.getElementById(`${type}-logo-input`);
  const remove = document.getElementById(`${type}-logo-remove`);

  wrap.addEventListener("click", () => input.click());
  input.addEventListener("change", e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Ảnh tối đa 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = e2 => {
      if (type === "home") homeBase64 = e2.target.result;
      else awayBase64 = e2.target.result;
      showLogoPreview(type, e2.target.result);
    };
    reader.readAsDataURL(file);
  });
  remove.addEventListener("click", () => {
    if (type === "home") homeBase64 = null; else awayBase64 = null;
    resetLogoPreview(type);
    // Nếu là edit, phải xóa field homeLogo đi trong db? Ta chỉ set null. 
    // Wait: backend MatchController chỉ update khi có base64. Nếu người ta xóa,
    // ta nên báo cần thiết kế API để xóa riêng, nhưng tạm thời reset view là ok.
  });
}

setupLogoUpload("home");
setupLogoUpload("away");

function showLogoPreview(type, src) {
  document.getElementById(`${type}-logo-img`).src = src;
  document.getElementById(`${type}-logo-img`).style.display = "block";
  document.getElementById(`${type}-logo-ph`).style.display = "none";
  document.getElementById(`${type}-logo-remove`).style.display = "block";
}

function resetLogoPreview(type) {
  document.getElementById(`${type}-logo-img`).src = "";
  document.getElementById(`${type}-logo-img`).style.display = "none";
  document.getElementById(`${type}-logo-ph`).style.display = "flex";
  document.getElementById(`${type}-logo-remove`).style.display = "none";
  document.getElementById(`${type}-logo-input`).value = "";
}


// ─── DELETE MODAL ─────────────────────────────────────────
window.openDelete = (id) => {
  deletingId = id;
  const a = allMatches.find(x => x.id === id);
  document.getElementById("delete-match-title").textContent = a ? `${a.home} vs ${a.away}` : "?";
  document.getElementById("delete-modal").classList.add("open");
};
function closeDeleteModal() { document.getElementById("delete-modal").classList.remove("open"); }
document.getElementById("delete-cancel-btn").addEventListener("click", closeDeleteModal);
document.getElementById("delete-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeDeleteModal(); });
document.getElementById("delete-confirm-btn").addEventListener("click", async () => {
  const btn = document.getElementById("delete-confirm-btn");
  btn.disabled = true; btn.textContent = "Đang xóa...";
  const result = await deleteMatch(deletingId);
  btn.disabled = false; btn.textContent = "Xóa ngay";
  if (result.error) { toast(result.error, "error"); return; }
  allMatches = allMatches.filter(x => x.id !== deletingId);
  toast(`Đã xóa trận đấu`, "error");
  closeDeleteModal(); applyFilters();
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
function formatDateString(ds) {
  if (!ds) return "";
  const parts = ds.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return ds;
}

function toast(msg, type = "success") {
  const wrap = document.getElementById("toast-wrap");
  const el   = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<i class="ti ti-${type === "success" ? "circle-check" : "alert-circle"}"></i>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

init();
