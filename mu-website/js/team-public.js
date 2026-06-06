import { listenAllPlayers } from "../controllers/PlayerController.js";
import { listenAllStaffs } from "../controllers/StaffController.js";

const grid = document.getElementById("team-grid");

// ── STATE ──
let currentPlayers = [];
let currentStaffs = [];
let playersLoaded = false;
let staffsLoaded = false;
let currentFilter = "all";
let currentRoleFilter = "";

// ── Từ điển map filter → tiếng Việt ──
const filterLabels = {
  'all':         'Toàn đội',
  'staff':       'Ban huấn luyện',
  'HLV_TRUONG':  'Huấn luyện viên trưởng',
  'HLV_THU_MON': 'HLV thủ môn',
  'TRO_LY_HLV':  'Trợ lý HLV',
  'BAC_SI':      'Bác sĩ / Y tế',
  'QUAN_LY':     'Quản lý đội',
  'gk':          'Thủ môn',
  'def':         'Hậu vệ',
  'mid':         'Tiền vệ',
  'fwd':         'Tiền đạo',
};

// ── Role label hiển thị trên card staff ──
const roleLabels = {
  HLV_TRUONG:  'Huấn Luyện Viên Trưởng',
  HLV_THU_MON: 'HLV Thủ Môn',
  TRO_LY_HLV:  'Trợ Lý HLV',
  BAC_SI:      'Bác Sĩ / Y Tế',
  QUAN_LY:     'Quản Lý Đội',
};

// ── Role abbreviation hiển thị thay số áo ──
const roleAbbr = {
  HLV_TRUONG:  'HC',
  HLV_THU_MON: 'GKC',
  TRO_LY_HLV:  'AC',
  BAC_SI:      'MED',
  QUAN_LY:     'MGR',
};

// ── INIT ──
function initTeam() {
  listenAllPlayers((res) => {
    if (!res.error) {
      currentPlayers = res.filter(p => p.status === "active" || p.status === "injured" || p.status === "suspend");
    }
    playersLoaded = true;
    checkAndRender();
  });

  listenAllStaffs((res) => {
    if (!res.error) {
      currentStaffs = res.filter(s => s.status === "active");
    }
    staffsLoaded = true;
    checkAndRender();
  });
}

function checkAndRender() {
  if (playersLoaded && staffsLoaded) {
    grid.classList.remove("flash-update");
    void grid.offsetWidth; // trigger reflow
    grid.classList.add("flash-update");

    renderTeam(currentPlayers, currentStaffs);
    setupFilters(currentStaffs);
    
    // Re-apply current filter after re-rendering
    applyFilter(currentFilter, currentRoleFilter);
  }
}


// ── RENDER ──
function renderTeam(players, staffs) {
  let html = '';
  const defaultImg = '../assessts/logoBit.png';

  function formatLongName(name) {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (name.length > 15 && words.length >= 3) {
      words[0] = '...';
      return words.join(' ');
    }
    return name;
  }

  // 1. Render danh sách STAFF từ Firebase
  staffs.forEach((s) => {
    const imgUrl = s.imgUrl || defaultImg;
    const isDefault = !s.imgUrl;
    const roleLabel = roleLabels[s.role] || s.roleLabel || s.role || 'Ban Huấn Luyện';
    const abbr = roleAbbr[s.role] || 'ST';

    // Tạo chữ cái đầu cho tag vị trí của staff
    let badgeText = '';
    if (roleLabel) {
      badgeText = roleLabel.split(/[\s/-]+/)
        .filter(w => w.length > 0)
        .map(w => w[0].toUpperCase())
        .join('');
    }

    html += `
      <a href="staff-detail.html?id=${s.id}" class="team-card staff-card fade-in" data-category="staff" data-role="${s.role || ''}">
        <div class="team-card-img">
          <img src="${imgUrl}" alt="${s.name}" loading="lazy"
               ${isDefault ? 'style="width:45%;opacity:0.15;margin:auto;"' : ''}
               onerror="this.src='${defaultImg}';this.style.cssText='width:45%;opacity:0.15;margin:auto;'" />
        </div>
        <div class="team-card-number">${abbr}</div>
        ${badgeText ? `<div class="team-card-badge">${badgeText}</div>` : ''}
        <div class="team-card-body">
          <div class="team-card-pos">${roleLabel}</div>
          <div class="team-card-name">${formatLongName(s.name)}</div>
        </div>
      </a>
    `;
  });

  // 2. Render danh sách CẦU THỦ từ Firebase
  players.forEach((p) => {
    const cat = p.pos ? p.pos.toLowerCase() : 'mid';
    const imgUrl = p.imgUrl || defaultImg;

    html += `
      <a href="player-detail.html?id=${p.id}" class="team-card fade-in" data-category="${cat}">
        <div class="team-card-img">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy"
               onerror="this.src='${defaultImg}';this.style.cssText='width:45%;opacity:0.15;margin:auto;'" />
        </div>
        <div class="team-card-number">${p.number || ''}</div>
        ${p.pos ? `<div class="team-card-badge">${p.pos.toUpperCase()}</div>` : ''}
        <div class="team-card-body">
          <div class="team-card-pos">${p.posLabel || p.pos}</div>
          <div class="team-card-name">${formatLongName(p.name)}</div>
        </div>
      </a>
    `;
  });

  // 3. Thẻ thông báo trống (ẩn mặc định)
  html += `
    <div id="team-empty-msg" style="display: none; grid-column: 1 / -1; text-align: center; min-height: 40vh; padding-top: 100px; color: var(--gray-mid); font-family: var(--font-condensed); font-size: 1.2rem; letter-spacing: 0.15em; text-transform: uppercase;">
      Chưa có dữ liệu
    </div>
  `;

  grid.innerHTML = html;

  // 4. Hiệu ứng hiện dần cho các thẻ
  setTimeout(() => {
    document.querySelectorAll(".team-card.fade-in").forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 60);
    });
  }, 100);
}



// ── HÀM LỌC CHUNG ──
function applyFilter(filter, roleFilter = '') {
  const cards = document.querySelectorAll(".team-card[data-category]");
  let visibleCount = 0;
  const emptyMsg = document.getElementById("team-empty-msg");

  cards.forEach((card) => {
    let show = false;

    if (filter === "all") {
      show = true;
    } else if (filter === "staff" && roleFilter) {
      show = card.dataset.category === "staff" && card.dataset.role === roleFilter;
    } else {
      show = card.dataset.category === filter;
    }

    if (show) {
      card.classList.remove("hidden");
      card.classList.remove("visible");
      setTimeout(() => card.classList.add("visible"), 30);
      visibleCount++;
    } else {
      card.classList.add("hidden");
    }
  });

  if (emptyMsg) {
    if (visibleCount === 0) {
      const label = roleFilter ? (filterLabels[roleFilter] || roleFilter) : (filterLabels[filter] || 'dữ liệu');
      emptyMsg.textContent = `Chưa có ${label}`;
      emptyMsg.style.display = "block";
    } else {
      emptyMsg.style.display = "none";
    }
  }

  // Khôi phục nút active nếu re-render
  const container = document.getElementById("team-filters-container");
  if (container) {
    container.querySelectorAll(".filter-btn").forEach(b => {
      b.classList.remove("active");
      if (b.dataset.filter === filter) b.classList.add("active");
    });
    const roleSelect = container.querySelector("#staff-role-select");
    if (roleSelect && roleFilter) roleSelect.value = roleFilter;
  }
}

// ── SETUP FILTERS ──
function setupFilters(staffs) {
  const filterContainer = document.getElementById("team-filters-container");
  
  // Tìm các role có trong data staff
  const staffRoles = [...new Set(staffs.map(s => s.role).filter(Boolean))];

  // Build lại nội dung filter buttons
  let filtersHTML = `
    <button class="filter-btn ${currentFilter==='all'?'active':''}" data-filter="all">Toàn Đội</button>
    <button class="filter-btn ${currentFilter==='staff'?'active':''}" data-filter="staff">BHL</button>
  `;

  // Thêm dropdown select cho các vai trò staff
  if (staffRoles.length > 0) {
    filtersHTML += `
      <select class="filter-role-select" id="staff-role-select">
        <option value="">── Lọc vai trò ──</option>
        ${staffRoles.map(role => `<option value="${role}" ${currentRoleFilter===role?'selected':''}>${roleLabels[role] || role}</option>`).join('')}
      </select>
    `;
  }

  // Thêm các nút filter cầu thủ
  filtersHTML += `
    <button class="filter-btn ${currentFilter==='gk'?'active':''}" data-filter="gk">Thủ Môn</button>
    <button class="filter-btn ${currentFilter==='def'?'active':''}" data-filter="def">Hậu Vệ</button>
    <button class="filter-btn ${currentFilter==='mid'?'active':''}" data-filter="mid">Tiền Vệ</button>
    <button class="filter-btn ${currentFilter==='fwd'?'active':''}" data-filter="fwd">Tiền Đạo</button>
  `;

  // Clone container để gỡ event listeners cũ
  const newContainer = filterContainer.cloneNode(false);
  newContainer.id = filterContainer.id;
  newContainer.className = filterContainer.className;
  newContainer.innerHTML = filtersHTML;
  filterContainer.parentNode.replaceChild(newContainer, filterContainer);

  // Hiện thanh filter
  setTimeout(() => {
    newContainer.classList.add("visible");
  }, 50);

  // ── Event listeners ──
  const filterBtns = newContainer.querySelectorAll(".filter-btn");
  const roleSelect = newContainer.querySelector("#staff-role-select");

  // Click nút filter
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      currentFilter = f;
      if (f !== "staff") currentRoleFilter = "";

      if (roleSelect && f !== "staff") roleSelect.value = '';

      applyFilter(currentFilter, currentRoleFilter);
    });
  });

  // Thay đổi select vai trò
  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      const selectedRole = roleSelect.value;
      currentFilter = "staff";
      currentRoleFilter = selectedRole;
      applyFilter(currentFilter, currentRoleFilter);
    });
  }
}

document.addEventListener("DOMContentLoaded", initTeam);