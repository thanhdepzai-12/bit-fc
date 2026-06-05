import { getStaffById } from "../controllers/StaffController.js";

const roleLabels = {
  HLV_TRUONG:  'Huấn Luyện Viên Trưởng',
  HLV_THU_MON: 'HLV Thủ Môn',
  TRO_LY_HLV:  'Trợ Lý HLV',
  BAC_SI:      'Bác Sĩ / Y Tế',
  QUAN_LY:     'Quản Lý Đội',
};

async function initDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNotFound();
    return;
  }

  const s = await getStaffById(id);
  
  if (s.error) {
    renderNotFound();
    return;
  }

  renderDetail(s);
}

function renderDetail(s) {
  const detail = document.getElementById('staff-detail');
  const defaultImg = "../assessts/logoBit.png";
  const imgUrl = s.imgUrl || defaultImg;
  const isDefault = !s.imgUrl;

  const teamWatermark = "MUFC";
  const roleLabel = roleLabels[s.role] || s.roleLabel || s.role || 'Ban Huấn Luyện';

  detail.innerHTML = `
    <div class="profile-top-grid">
      
      <div class="profile-hero-card">
        <img src="${imgUrl}" alt="${s.name}" loading="lazy" ${isDefault ? 'style="width:45%;opacity:0.15;margin:auto;"' : ''} onerror="this.src='${defaultImg}';" />
        <div class="profile-hero-overlay"></div>
        <div class="profile-hero-text">
          <span>${teamWatermark}</span>
          <h2>${s.name}</h2>
        </div>
      </div>

      <div class="profile-info-section">
        <div class="profile-badge">${roleLabel}</div>
        <h1 class="profile-name">${s.name}</h1>
        <div class="profile-subtitle">THE PRIDE OF MANCHESTER</div>

        <div class="profile-basic-grid">
          <div class="basic-card">
            <div class="basic-label">QUỐC TỊCH <i class="ti ti-map-pin"></i></div>
            <div class="basic-value">${s.nationality || 'Đang cập nhật'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">NGÀY SINH <i class="ti ti-calendar"></i></div>
            <div class="basic-value">${s.birth || 'Đang cập nhật'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">ĐIỆN THOẠI <i class="ti ti-phone"></i></div>
            <div class="basic-value" style="font-size: 1.2rem;">${s.phone || '—'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">EMAIL <i class="ti ti-mail"></i></div>
            <div class="basic-value" style="font-size: 1.2rem;">${s.email || '—'}</div>
          </div>
        </div>

        <div class="profile-bio-box">
          <div class="bio-header">
            <div class="bio-title">| HỒ SƠ BAN HUẤN LUYỆN</div>
            <i class="ti ti-quote"></i>
          </div>
          <p class="bio-text">
            <span class="bio-dropcap">${s.name ? s.name.charAt(0) : 'M'}</span>${s.bio || 'Thông tin tiểu sử ban huấn luyện đang được cập nhật thêm trong thời gian tới.'}
          </p>
        </div>
        
        <div class="profile-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Năm gia nhập</span>
            <span class="stat-value">${s.joined || new Date().getFullYear()}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Vai trò</span>
            <span class="stat-value" style="font-size: 1.5rem; text-align: center;">${roleLabel}</span>
          </div>
        </div>

      </div>
    </div>

  
    </div>
  `;
  
  document.title = `${s.name} - BIT FC`;
  setTimeout(() => detail.classList.add("visible"), 50);
}

function renderNotFound() {
  const detail = document.getElementById('staff-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div style="text-align: center; padding: 100px 0;">
      <h2 style="font-size: 2rem; margin-bottom: 20px;">Không tìm thấy thành viên BHL</h2>
      <p style="color: var(--gray-mid); margin-bottom: 30px;">Thông tin ban huấn luyện đang được cập nhật hoặc đường dẫn không hợp lệ.</p>
      <a href="team.html" class="btn btn-primary">Quay lại Đội Hình</a>
    </div>
  `;
  setTimeout(() => detail.classList.add("visible"), 50);
}

document.addEventListener('DOMContentLoaded', initDetail);
