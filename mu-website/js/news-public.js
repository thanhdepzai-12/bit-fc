import { listenPublishedNews } from "../controllers/NewsController.js";

let currentLimit = 6;
const LIMIT_STEP = 6;
const grid = document.getElementById("news-grid");
const loadMoreBtn = document.getElementById("load-more-news");

let unsubscribeNews = null;

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initNewsListener() {
  if (!grid) return;

  if (currentLimit === LIMIT_STEP) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a1a1aa; padding: 40px 0;">Đang tải tin tức...</p>';
  }

  if (unsubscribeNews) unsubscribeNews();

  unsubscribeNews = listenPublishedNews(currentLimit, (res) => {
    if (res.error) {
      console.error(res.error);
      if (currentLimit === LIMIT_STEP) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--red-mid);">Lỗi tải dữ liệu. (Bấm F12 kiểm tra Index)</p>';
      return;
    }

    // Báo nếu chưa có bài nào
    if (res.results.length === 0) {
       grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a1a1aa; padding: 40px 0;">Chưa có bài báo nào được xuất bản.</p>';
       if (loadMoreBtn) loadMoreBtn.style.display = "none";
       return;
    }

    grid.innerHTML = ""; // Xóa grid cũ để render lại
    
    // Thêm class nháy sáng nhẹ
    grid.classList.remove("flash-update");
    void grid.offsetWidth;
    grid.classList.add("flash-update");

    // Vẽ các thẻ HTML động
    res.results.forEach((a, index) => {
      const dateStr = formatDate(a.publishedAt);
      const card = document.createElement("a");
      card.href = `news-detail.html?id=${a.id}`;
      card.className = "news-page-card fade-in";
      
      const imgUrl = a.coverUrl || '../assessts/logoBit.png';

      card.addEventListener("mouseenter", () => {
        import("../controllers/NewsController.js").then(m => {
          if (m.getNewsById) m.getNewsById(a.id);
        });
      }, { once: true });

      card.innerHTML = `
        <div class="news-page-card-image">
          <img src="${imgUrl}" alt="${a.title}" loading="lazy" onerror="this.src='../assessts/logoBit.png';" />
        </div>
        <div class="news-page-card-overlay">
          <div class="news-page-card-header">
            <span class="news-page-tag">${a.category || 'Tin Tức'}</span>
            <span class="news-page-date">📅 ${dateStr}</span>
          </div>
          <h3>${a.title}</h3>
          <div class="news-page-card-divider"></div>
          <span class="news-read-link">Đọc Tiếp →</span>
        </div>
      `;
      grid.appendChild(card);

      setTimeout(() => {
        card.classList.add("visible");
      }, Math.min(index * 50, 500)); 
    });

    // Ẩn/hiện nút tải thêm
    if (loadMoreBtn) {
      if (!res.hasMore) {
        loadMoreBtn.style.display = "none"; 
      } else {
        loadMoreBtn.style.display = "inline-block";
        loadMoreBtn.textContent = "Xem thêm tin cũ";
        loadMoreBtn.style.pointerEvents = "auto";
      }
    }
  });
}

function handleLoadMore() {
  if (loadMoreBtn) {
    loadMoreBtn.textContent = "Đang tải...";
    loadMoreBtn.style.pointerEvents = "none";
  }
  currentLimit += LIMIT_STEP;
  initNewsListener();
}

document.addEventListener("DOMContentLoaded", () => {
  if(loadMoreBtn) loadMoreBtn.addEventListener("click", handleLoadMore);
  initNewsListener();
});