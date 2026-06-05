import { listenPublishedNews } from "../controllers/NewsController.js";

const grid = document.querySelector(".news-section .news-grid");
let unsubscribeNews = null;

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initHomeNews() {
  if (!grid) return;

  grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a1a1aa; padding: 40px 0;">Đang tải tin tức...</p>';

  if (unsubscribeNews) unsubscribeNews();

  unsubscribeNews = listenPublishedNews(4, (res) => {
    if (res.error) {
      console.error(res.error);
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--red-mid);">Lỗi tải dữ liệu.</p>';
      return;
    }

    if (res.results.length === 0) {
       grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a1a1aa; padding: 40px 0;">Chưa có bài báo nào được xuất bản.</p>';
       return;
    }

    grid.innerHTML = ""; 
    
    res.results.forEach((a, index) => {
      const dateStr = formatDate(a.publishedAt);
      const card = document.createElement("a");
      card.href = `pages/news-detail.html?id=${a.id}`;
      card.className = "news-card fade-in";
      
      // Giới hạn tóm tắt khoảng 100 ký tự nếu quá dài
      let shortSummary = a.summary || '';
      if (shortSummary.length > 120) {
        shortSummary = shortSummary.substring(0, 120) + '...';
      }

      card.addEventListener("mouseenter", () => {
        import("../controllers/NewsController.js").then(m => {
          if (m.getNewsById) m.getNewsById(a.id);
        });
      }, { once: true });

      card.innerHTML = `
        <div class="news-card-body">
          <div class="news-tag">${a.category || 'Tin Tức'}</div>
          <h3>${a.title}</h3>
          <p>${shortSummary}</p>
        </div>
        <div class="news-card-footer">
          <span class="news-date">${dateStr}</span>
          <span class="news-read-more">Đọc bài viết →</span>
        </div>
      `;
      grid.appendChild(card);

      setTimeout(() => {
        card.classList.add("visible");
      }, Math.min(index * 100, 500)); 
    });
  });
}

document.addEventListener("DOMContentLoaded", initHomeNews);
