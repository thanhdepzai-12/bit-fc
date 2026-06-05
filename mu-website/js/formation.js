import { listenAllPlayers } from "../controllers/PlayerController.js";

// ── STATE ──
let allPlayers = [];
let formationState = {
  ST: null, LM: null, CM: null, RM: null, LCB: null, RCB: null, GK: null,
  SUB1: null, SUB2: null, SUB3: null, SUB4: null, SUB5: null, SUB6: null, SUB7: null
};

// Map position to a more friendly name for empty slots
const posLabels = {
  ST: "Tiền Đạo", LM: "Tiền Vệ Trái", CM: "Tiền Vệ TT", RM: "Tiền Vệ Phải", LCB: "Hậu Vệ Trái", RCB: "Hậu Vệ Phải", GK: "Thủ Môn",
  SUB1: "Dự Bị", SUB2: "Dự Bị", SUB3: "Dự Bị", SUB4: "Dự Bị", SUB5: "Dự Bị", SUB6: "Dự Bị", SUB7: "Dự Bị"
};

const defaultImg = '../assessts/logoBit.png';
let activeSlotId = null;

// ── INIT ──
export function initFormation() {
  const container = document.getElementById("formation-container");
  if (!container) return;

  // Render base HTML
  container.innerHTML = `
    <div class="formation-section">
      <div class="formation-header">
        <h2>Đội Hình Ra Sân</h2>
        <p>Bấm vào các vị trí để xếp đội hình 7 người của bạn</p>
      </div>
      <div class="pitch-container" id="pitch-container">
        <!-- Các vị trí sẽ được render bằng JS -->
      </div>
      <div class="subs-container" id="subs-container">
        <!-- Danh sách dự bị -->
      </div>
    </div>
    
    <!-- Modal chọn cầu thủ -->
    <div class="formation-modal-overlay" id="formation-modal-overlay">
      <div class="formation-modal" id="formation-modal">
        <div class="formation-modal-header">
          <div class="formation-modal-title">Chọn Cầu Thủ</div>
          <button class="formation-modal-close" id="formation-modal-close">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="formation-modal-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
          <input type="text" id="formation-search" placeholder="Tìm tên cầu thủ..." />
        </div>
        <div class="formation-modal-body" id="formation-modal-body">
          <!-- Danh sách cầu thủ -->
        </div>
      </div>
    </div>
  `;

  // Restore state từ localStorage nếu có
  const saved = localStorage.getItem("bitfc_formation");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge để không làm mất các key mới như SUB1...SUB7
      formationState = { ...formationState, ...parsed };
    } catch (e) {
      console.error(e);
    }
  }

  renderPitch();
  setupEvents();

  // Load danh sách cầu thủ (chỉ lấy những người active/injured/suspend)
  listenAllPlayers((res) => {
    if (!res.error) {
      allPlayers = res.filter(p => p.status === "active" || p.status === "injured" || p.status === "suspend");
    }
  });
}

function renderPitch() {
  const pitch = document.getElementById("pitch-container");
  const subs = document.getElementById("subs-container");
  if (!pitch || !subs) return;

  let pitchHtml = `<img class="pitch-bg" src="../assessts/field-tactic.png" alt="Sân bóng" />`;
  let subHtml = `<div class="subs-header"><h3>DỰ BỊ</h3></div><div class="subs-grid">`;
  
  Object.keys(formationState).forEach(pos => {
    const player = formationState[pos];
    const isSub = pos.startsWith("SUB");
    const slotClass = isSub ? "sub-slot" : "slot";
    const label = posLabels[pos] || pos;
    
    let slotStr = "";
    if (player) {
      // Slot đã có người (Filled)
      const imgUrl = player.imgUrl || defaultImg;
      slotStr = `
        <div class="${slotClass}" data-pos="${pos}" onclick="openModal('${pos}')">
          <div class="slot-filled">
            <div class="card-top">
              <img class="card-img" src="${imgUrl}" alt="${player.name}" onerror="this.src='${defaultImg}'" />
              <div class="card-ovr">${player.number || '-'}</div>
              <div class="card-pos-label">${player.pos || pos}</div>
            </div>
            <div class="card-bottom">
              <div class="card-name">${player.name}</div>
            </div>
          </div>
          <button class="slot-remove" onclick="removePlayer(event, '${pos}')">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
      `;
    } else {
      // Slot trống (Empty)
      slotStr = `
        <div class="${slotClass}" data-pos="${pos}" onclick="openModal('${pos}')">
          <div class="slot-empty">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
            <div class="pos-label">${isSub ? "EMPTY" : label}</div>
          </div>
        </div>
      `;
    }

    if (isSub) subHtml += slotStr;
    else pitchHtml += slotStr;
  });

  subHtml += `</div>`;
  pitch.innerHTML = pitchHtml;
  subs.innerHTML = subHtml;
}

function setupEvents() {
  const modalOverlay = document.getElementById("formation-modal-overlay");
  const closeBtn = document.getElementById("formation-modal-close");
  const searchInput = document.getElementById("formation-search");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderModalList(e.target.value.toLowerCase());
    });
  }
}

// Hàm được gắn trên window để gọi từ inline onclick
window.openModal = function(pos) {
  activeSlotId = pos;
  document.getElementById("formation-modal-overlay").classList.add("open");
  const searchInput = document.getElementById("formation-search");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  renderModalList();
};

window.closeModal = function() {
  document.getElementById("formation-modal-overlay").classList.remove("open");
  activeSlotId = null;
};

window.removePlayer = function(e, pos) {
  e.stopPropagation(); // Ngăn sự kiện mở modal
  formationState[pos] = null;
  saveState();
  renderPitch();
};

window.selectPlayer = function(playerId) {
  const player = allPlayers.find(p => p.id === playerId);
  if (player && activeSlotId) {
    // Nếu cầu thủ này đã ở vị trí khác, thì gỡ ra khỏi vị trí đó
    Object.keys(formationState).forEach(pos => {
      if (formationState[pos] && formationState[pos].id === player.id) {
        formationState[pos] = null;
      }
    });
    
    // Gán vào vị trí mới
    formationState[activeSlotId] = player;
    saveState();
    renderPitch();
    closeModal();
  }
};

function renderModalList(searchTerm = "") {
  const body = document.getElementById("formation-modal-body");
  if (!body) return;

  // Lọc theo search
  let filtered = allPlayers;
  if (searchTerm.trim() !== "") {
    filtered = allPlayers.filter(p => p.name.toLowerCase().includes(searchTerm) || (p.number && p.number.toString().includes(searchTerm)));
  }

  if (filtered.length === 0) {
    body.innerHTML = `<div class="f-empty-state">Không tìm thấy cầu thủ</div>`;
    return;
  }

  let html = "";
  filtered.forEach(p => {
    // Highlight nếu cầu thủ đã được xếp vào sân
    const isSelected = Object.values(formationState).some(s => s && s.id === p.id);
    const imgUrl = p.imgUrl || defaultImg;
    
    html += `
      <div class="formation-player-item ${isSelected ? 'selected' : ''}" onclick="selectPlayer('${p.id}')">
        <img class="f-player-img" src="${imgUrl}" alt="${p.name}" onerror="this.src='${defaultImg}'" />
        <div class="f-player-info">
          <div class="f-player-name">${p.name}</div>
          <div class="f-player-pos">${p.posLabel || p.pos} ${isSelected ? '(Đã chọn)' : ''}</div>
        </div>
        <div class="f-player-num">${p.number || ''}</div>
      </div>
    `;
  });

  body.innerHTML = html;
}

function saveState() {
  localStorage.setItem("bitfc_formation", JSON.stringify(formationState));
}

// Kích hoạt ngay lập tức vì script type="module" đã được defer
if (document.getElementById("formation-container")) {
  initFormation();
}
