/**
 * auth-guard.js
 * Bảo vệ các trang trong Management — chỉ cho phép user đã đăng nhập.
 *
 * Cách dùng: thêm vào ĐẦU mỗi trang protected (dashboard, news-panel, players-panel, ...)
 *
 *   <script type="module" src="../../js/Management/auth-guard.js"></script>
 *
 * Guard sẽ:
 *   1. Ẩn toàn bộ nội dung trang ngay lập tức (tránh flash)
 *   2. Đợi Firebase xác nhận trạng thái auth
 *   3. Nếu CHƯA đăng nhập  → redirect về Login
 *   4. Nếu ĐÃ đăng nhập    → hiện trang + gắn user vào window.__currentUser
 */

import { onAuthChange, logout } from "../../controllers/AuthenticationController.js";

const LOGIN_URL = "../../Login.html"; // ← đổi nếu path khác

// 1. Ẩn trang ngay lập tức — tránh flash nội dung cho user chưa auth
document.documentElement.style.visibility = "hidden";

// Tiêm Preloader vào trang
if (document.body) {
  const preloaderStyle = document.createElement('style');
  preloaderStyle.innerHTML = `
  #preloader { position: fixed; inset: 0; background: #0a0000; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.6s ease, visibility 0.6s ease; visibility: visible !important; opacity: 1 !important; }
  #preloader.hidden { opacity: 0 !important; visibility: hidden !important; pointer-events: none; }
  #preloader .pre-logo { width: 300px; animation: preLogoSpin 1.5s ease-in-out infinite alternate; filter: drop-shadow(0 0 24px rgba(218, 41, 28, 0.9)); }
  #preloader .pre-text { font-family: Oswald, sans-serif; font-size: 2.4rem; letter-spacing: 0.3em; color: #DA291C; margin-top: 1.5rem; animation: fadeInUp 0.8s ease both; }
  #preloader .pre-sub { font-family: "Barlow Condensed", sans-serif; font-size: 0.9rem; letter-spacing: 0.5em; color: #a87070; margin-top: 0.4rem; text-transform: uppercase; }
  #preloader .pre-bar-wrap { width: 200px; height: 2px; background: #3a1a1a; margin-top: 2.5rem; border-radius: 1px; overflow: hidden; }
  #preloader .pre-bar { height: 100%; background: #DA291C; border-radius: 1px; animation: preBar 1.8s ease forwards; }
  @keyframes preLogoSpin { from { transform: scale(0.9) rotate(-4deg); } to { transform: scale(1.05) rotate(4deg); } }
  @keyframes preBar { from { width: 0; } to { width: 100%; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 768px) { #preloader .pre-logo { width: 220px; } #preloader .pre-text { font-size: 1.8rem; } #preloader .pre-sub { font-size: 0.75rem; } }
  `;
  document.head.appendChild(preloaderStyle);

  const preloaderHTML = `
    <div id="preloader">
      <img class="pre-logo" src="../../assessts/logoBit.png" alt="NONE BIT FC" />
      <div class="pre-text">NONE BIT FC</div>
      <div class="pre-sub">The Pride of Banking IT</div>
      <div class="pre-bar-wrap"><div class="pre-bar"></div></div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', preloaderHTML);
}

// 2. Lắng nghe trạng thái auth (Firebase trả về trong ~200–400ms)
const unsubscribe = onAuthChange((user) => {
  unsubscribe(); // chỉ cần check 1 lần lúc load

  if (!user) {
    // Chưa đăng nhập → redirect về Login, kèm returnUrl để sau login quay lại
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`${LOGIN_URL}?returnUrl=${returnUrl}`);
    return;
  }

  // Đã đăng nhập → hiện trang
  document.documentElement.style.visibility = "";

  // Ẩn preloader sau 800ms
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  }, 800);

  // Expose user ra global để các script khác trong trang dùng nếu cần
  window.__currentUser = user;

  // Cập nhật tên user và thêm nút Logout vào sidebar
  const updateUI = () => {
    // Cập nhật tên user trên topbar
    const greetEl = document.querySelector('.greet');
    if (greetEl) {
      const userName = user.displayName || user.email.split('@')[0];
      greetEl.innerHTML = `Xin chào, <strong style="color: var(--white);">${userName}</strong>`;
    }

    // Thêm nút Đăng xuất vào cuối danh sách nav-item (trước sidebar-bottom)
    const sidebarBottom = document.querySelector('.sidebar-bottom');
    if (sidebarBottom && !document.getElementById('sidebar-logout-btn')) {
      sidebarBottom.insertAdjacentHTML('beforebegin', `<a href="#" class="nav-item" id="sidebar-logout-btn" style="color: var(--red-mid);"><i class="ti ti-logout"></i>Đăng xuất</a>`);
      
      // Inject modal đăng xuất
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" id="logout-modal">
          <div class="delete-card">
            <div class="delete-body">
              <div class="delete-icon-wrap"><i class="ti ti-logout"></i></div>
              <div class="delete-title">Xác nhận đăng xuất</div>
              <div class="delete-msg">
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị không?
              </div>
            </div>
            <div class="delete-footer">
              <button class="btn-cancel" id="logout-cancel-btn">Hủy</button>
              <button class="btn-del-confirm" id="logout-confirm-btn">Có, Đăng xuất</button>
            </div>
          </div>
        </div>
      `);

      const logoutModal = document.getElementById('logout-modal');
      
      document.getElementById('sidebar-logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logoutModal.classList.add('open');
      });

      document.getElementById('logout-cancel-btn').addEventListener('click', () => {
        logoutModal.classList.remove('open');
      });

      document.getElementById('logout-confirm-btn').addEventListener('click', async () => {
        await logout();
        window.location.replace('/mu-website/index.html');
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateUI);
  } else {
    updateUI();
  }

  // Dispatch event để các module khác biết auth đã sẵn sàng
  window.dispatchEvent(new CustomEvent("authReady", { detail: { user } }));
});
