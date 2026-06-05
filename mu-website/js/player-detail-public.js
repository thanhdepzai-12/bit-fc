import { listenPlayerById } from "../controllers/PlayerController.js";

function initDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNotFound();
    return;
  }

  listenPlayerById(id, (p) => {
    if (p.error) {
      renderNotFound();
      return;
    }

    renderDetail(p);
  });
}

function renderDetail(p) {
  const detail = document.getElementById('player-detail');
  const defaultImg = "../assessts/logoBit.png";
  const imgUrl = p.imgUrl || defaultImg;

  // Lấy chữ cái đầu làm logo làm chìm ở góc thẻ
  const teamWatermark = "MUFC";

  detail.innerHTML = `
    <div class="profile-top-grid">
      
      <div class="profile-hero-card">
        <div class="profile-hero-number">${p.number || ''}</div>
        <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.src='${defaultImg}';" />
        <div class="profile-hero-overlay"></div>
        <div class="profile-hero-text">
          <span>${teamWatermark}</span>
          <h2>${p.name}</h2>
        </div>
      </div>

      <div class="profile-info-section">
        <div class="profile-badge">${p.posLabel || p.pos}</div>
        <h1 class="profile-name">${p.name}</h1>
        <div class="profile-subtitle">THE PRIDE OF MANCHESTER</div>

        <div class="profile-basic-grid">
          <div class="basic-card">
            <div class="basic-label">QUỐC TỊCH <i class="ti ti-map-pin"></i></div>
            <div class="basic-value">${p.nationality || 'Đang cập nhật'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">NGÀY SINH <i class="ti ti-calendar"></i></div>
            <div class="basic-value">${p.birth || 'Đang cập nhật'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">CHIỀU CAO <i class="ti ti-ruler-measure"></i></div>
            <div class="basic-value">${p.height || '—'}</div>
          </div>
          <div class="basic-card">
            <div class="basic-label">CÂN NẶNG <i class="ti ti-barbell"></i></div>
            <div class="basic-value">${p.weight || '—'}</div>
          </div>
        </div>

        <div class="profile-bio-box">
          <div class="bio-header">
            <div class="bio-title">| HỒ SƠ CẦU THỦ</div>
            <i class="ti ti-quote"></i>
          </div>
          <p class="bio-text">
            <span class="bio-dropcap">${p.name ? p.name.charAt(0) : 'M'}</span>${p.bio || 'Thông tin tiểu sử cầu thủ đang được cập nhật thêm trong thời gian tới.'}
          </p>
        </div>
        
        <div class="profile-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Số trận</span>
            <span class="stat-value">${p.appearances || 0}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Bàn thắng</span>
            <span class="stat-value">${p.goals || 0}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Kiến tạo</span>
            <span class="stat-value">${p.assists || 0}</span>
          </div>
        </div>

      </div>
    </div>

    <div class="profile-moments-section">
      <div class="moments-header">
        <h2>KHOẢNH KHẮC <span class="highlight">CẦU THỦ</span></h2>
        <div class="moments-tabs">
          <button class="active">TẤT CẢ</button>
          <button>HÌNH ẢNH</button>
          <button>VIDEO</button>
        </div>
      </div>

      <div class="moments-slider">
        
        <div class="moment-item">
          <img src="https://images.unsplash.com/photo-1517927033932-bd0f9af8e0c5?w=800&q=80" alt="Video" />
          <div class="moment-type-badge video">VIDEO <i class="ti ti-player-play"></i></div>
          <div class="moment-title">Pha xử lý đẳng cấp trong trận Derby</div>
        </div>

        <div class="moment-item">
          <img src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80" alt="Ảnh" />
          <div class="moment-type-badge photo">PHOTO <i class="ti ti-photo"></i></div>
          <div class="moment-title">Đường chuyền dài chuẩn xác</div>
        </div>

        <div class="moment-item">
          <img src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&q=80" alt="Ảnh" />
          <div class="moment-type-badge photo">PHOTO <i class="ti ti-photo"></i></div>
          <div class="moment-title">Tranh chấp bóng quyết liệt</div>
        </div>

        <div class="moment-item">
          <img src="https://images.unsplash.com/photo-1509223197845-458d87318791?w=800&q=80" alt="Video" />
          <div class="moment-type-badge video">VIDEO <i class="ti ti-player-play"></i></div>
          <div class="moment-title">Bàn thắng chốt hạ cảm xúc</div>
        </div>

      </div>
    </div>
  `;
  
  document.title = `${p.name} - BIT FC`;
  setTimeout(() => detail.classList.add("visible"), 50);
}

function renderNotFound() {
  const detail = document.getElementById('player-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div style="text-align: center; padding: 100px 0;">
      <h2 style="font-size: 2rem; margin-bottom: 20px;">Không tìm thấy cầu thủ</h2>
      <p style="color: var(--gray-mid); margin-bottom: 30px;">Thông tin cầu thủ đang được cập nhật hoặc đường dẫn không hợp lệ.</p>
      <a href="team.html" class="btn btn-primary">Quay lại Đội Hình</a>
    </div>
  `;
  setTimeout(() => detail.classList.add("visible"), 50);
}

document.addEventListener('DOMContentLoaded', initDetail);