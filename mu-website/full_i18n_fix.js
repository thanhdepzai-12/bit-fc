const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove mute button
html = html.replace(/<button id="mute-btn" aria-label="Bật\/Tắt âm thanh">🔇<\/button>/g, '');

// 2. Append audio-player.js and version bump language.js
if (!html.includes('audio-player.js')) {
    html = html.replace(/<\/body>/, '  <script src="js/audio-player.js?v=5"></script>\n</body>');
}
html = html.replace(/"js\/language\.js(\?v=\d+)?"/, '"js/language.js?v=5"');

// 3. Inject language switcher into Navbar if not there
if (!html.includes('<li class="lang-menu">')) {
  html = html.replace(
    /<li><a href="#contact">Liên Hệ<\/a><\/li>/g,
    '<li><a href="#contact" data-i18n="nav_contact">Liên Hệ</a></li>\n      <li class="lang-menu">\n        <button class="lang-btn active" data-lang="vi" aria-label="Tiếng Việt">\n          <img src="https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg" alt="VI" />\n        </button>\n        <button class="lang-btn" data-lang="en" aria-label="English">\n          <img src="https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg" alt="EN" />\n        </button>\n      </li>'
  );
}

// 4. Inject language switcher into mobile-nav if not there
if (!html.includes('<div class="lang-menu">') && html.includes('<div class="mobile-nav">')) {
  html = html.replace(
    /<a href="#contact">Liên Hệ<\/a>/,
    '<a href="#contact" data-i18n="nav_contact">Liên Hệ</a>\n    <div class="lang-menu" style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;">\n      <button class="lang-btn active" data-lang="vi" aria-label="Tiếng Việt" style="background:none; border:none; cursor:pointer;">\n        <img src="https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg" alt="VI" style="width: 24px; border-radius: 3px;" />\n      </button>\n      <button class="lang-btn" data-lang="en" aria-label="English" style="background:none; border:none; cursor:pointer;">\n        <img src="https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg" alt="EN" style="width: 24px; border-radius: 3px;" />\n      </button>\n    </div>'
  );
}

// 5. Replace basic tags
const replacements = [
  // Navbar
  { search: 'class="active">Trang chủ</a>', replace: 'class="active" data-i18n="nav_home">Trang chủ</a>' },
  { search: '<a href="index.html">Trang chủ</a>', replace: '<a href="index.html" data-i18n="nav_home">Trang chủ</a>' },
  { search: '<a href="pages/team.html">Đội Hình</a>', replace: '<a href="pages/team.html" data-i18n="nav_team">Đội Hình</a>' },
  { search: '<a href="pages/gallery.html">Thư Viện</a>', replace: '<a href="pages/gallery.html" data-i18n="nav_gallery">Thư Viện</a>' },
  { search: '<a href="pages/history.html">Thành Tích</a>', replace: '<a href="pages/history.html" data-i18n="nav_history">Thành Tích</a>' },
  { search: '<a href="pages/news.html">Tin Tức</a>', replace: '<a href="pages/news.html" data-i18n="nav_news">Tin Tức</a>' },
  { search: '<a href="pages/Management/dashboard.html">Quản Lý</a>', replace: '<a href="pages/Management/dashboard.html" data-i18n="nav_management">Quản Lý</a>' },

  // Hero
  { search: '<span class="btn-text">KHÁM PHÁ NGAY', replace: '<span class="btn-text"><span data-i18n="hero_explore">KHÁM PHÁ NGAY</span>' },
  { search: '<span class="btn-text">ĐỘI HÌNH</span>', replace: '<span class="btn-text" data-i18n="hero_squad">ĐỘI HÌNH</span>' },

  // Match Board
  { search: 'onclick="mbSw(\'match\')">4EVEREST CUP · 2026</button>', replace: 'onclick="mbSw(\'match\')" data-i18n="mb_match">4EVEREST CUP · 2026</button>' },
  { search: 'onclick="mbSw(\'std\')">VUA PHÁ LƯỚI</button>', replace: 'onclick="mbSw(\'std\')" data-i18n="mb_top_scorer">VUA PHÁ LƯỚI</button>' },
  { search: '<div class="mb-cd-label">Bắt đầu sau</div>', replace: '<div class="mb-cd-label" data-i18n="mb_starts_in">Bắt đầu sau</div>' },
  { search: '<div class="mb-cd-lbl">NGÀY</div>', replace: '<div class="mb-cd-lbl" data-i18n="mb_days">NGÀY</div>' },
  { search: '<div class="mb-cd-lbl">GIỜ</div>', replace: '<div class="mb-cd-lbl" data-i18n="mb_hours">GIỜ</div>' },
  { search: '<div class="mb-cd-lbl">PHÚT</div>', replace: '<div class="mb-cd-lbl" data-i18n="mb_minutes">PHÚT</div>' },
  { search: '<div class="mb-cd-lbl">GIÂY</div>', replace: '<div class="mb-cd-lbl" data-i18n="mb_seconds">GIÂY</div>' },
  { search: '<div class="mb-std-p">Cầu Thủ · Đội</div>', replace: '<div class="mb-std-p"><span data-i18n="mb_player_team">Cầu Thủ · Đội</span></div>' },
  { search: '<div class="mb-std-m">Trận</div>', replace: '<div class="mb-std-m"><span data-i18n="mb_apps">Trận</span></div>' },
  { search: '<div class="mb-std-w">Bàn / % KL</div>', replace: '<div class="mb-std-w"><span data-i18n="mb_goals_ratio">Bàn / % KL</span></div>' },

  // About
  { search: '<span class="section-label">Câu Chuyện Của Chúng Tôi</span>', replace: '<span class="section-label" data-i18n="about_label">Câu Chuyện Của Chúng Tôi</span>' },
  { search: '<h2 class="section-title">Hơn Cả Một<br />Câu Lạc Bộ</h2>', replace: '<h2 class="section-title" data-i18n="about_title">Hơn Cả Một<br />Câu Lạc Bộ</h2>' },
  { search: '<div class="stat-label">Thành Lập</div>', replace: '<div class="stat-label" data-i18n="about_founded">Thành Lập</div>' },
  { search: '<div class="stat-label">Danh Hiệu</div>', replace: '<div class="stat-label" data-i18n="about_trophies">Danh Hiệu</div>' },
  { search: '<div class="stat-label">Fan Hâm Mộ</div>', replace: '<div class="stat-label" data-i18n="about_fans">Fan Hâm Mộ</div>' },
];

for (const r of replacements) {
  html = html.replaceAll(r.search, r.replace); // use replaceAll to cover mobile-nav + desktop-nav
}

// Multiline About
html = html.replace(/<p>Được thành lập bởi.*?không giới hạn\.<\/p>/s, '<p data-i18n="about_p1">Được thành lập bởi những anh em mang trong mình DNA công nghệ, None Bit FC đã vươn mình bứt phá khỏi những dòng code khô khan để trở thành một thế lực đáng gờm trên các mặt sân phủi và là biểu tượng của tinh thần chiến đấu không giới hạn.</p>');
html = html.replace(/<p>Từ những trận cầu.*?sinh ra\.<\/p>/s, '<p data-i18n="about_p2">Từ những trận cầu "giao lưu trà đá" thuở sơ khai đến những chiến dịch tăng tốc nảy lửa, mỗi trận đấu trên mặt cỏ nhân tạo — "Nhà hát của những gã du mục IT" — là một lần hệ thống được đẩy lên mức tối đa, nơi anh em kề vai sát cánh giải mã thế trận và những huyền thoại được sinh ra.</p>');

fs.writeFileSync('index.html', html, 'utf8');
console.log("index.html fully updated with JS and i18n.");
