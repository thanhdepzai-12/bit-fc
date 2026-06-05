import { getNewsById } from "../controllers/NewsController.js";

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const renderNewsNotFound = () => {
  const detail = document.getElementById('news-detail');
  if (!detail) return;
  detail.innerHTML = `
    <div class="news-detail-notfound">
      <h2>Không tìm thấy bài viết</h2>
      <p>Bài viết bạn đang tìm không tồn tại hoặc đã bị ẩn.</p>
      <a href="news.html" class="btn btn-primary">Quay lại Tin Tức</a>
    </div>
  `;
};

const renderNewsDetail = (news) => {
  const detail = document.getElementById('news-detail');
  if (!detail) return;

  // Tách text từ textarea (theo dấu enter) thành các đoạn <p>
  const paragraphs = news.content.split('\n').filter(p => p.trim() !== '');
  
  // Tính phút đọc
  const wordCount = (news.summary + " " + news.content).split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 220))} phút đọc`;
  
  // Trích xuất 3 đoạn đầu tiên làm điểm nhấn
  const highlights = paragraphs.slice(0, 3).map((item) => `
      <li>${item.replace(/\.$/, '')}</li>
    `).join('');

  const dateStr = formatDate(news.publishedAt);

  // Render 100% đúng cấu trúc class của bạn
  detail.innerHTML = `
    <div class="news-detail-hero">
      <div class="news-detail-visual">
        <img src="${news.coverUrl || '../assessts/logoBit.png'}" alt="${news.title}" loading="lazy" onerror="this.src='../assessts/logoBit.png';" />
      </div>
      <div class="news-detail-header">
        <span class="section-label">${news.category || 'Tin Tức'}</span>
        <h1 class="section-title">${news.title}</h1>
        <div class="news-detail-meta">
          <span>${dateStr}</span>
          <span class="news-detail-badge">${readTime}</span>
        </div>
        <p class="news-detail-intro">${news.summary || ''}</p>
      </div>
    </div>

    <div class="news-detail-grid">
      <article class="news-detail-article">
        ${paragraphs.map(p => `<p>${p}</p>`).join('')}
      </article>
      <aside class="news-detail-aside">
        <div class="news-detail-aside-card">
          <h3>Điểm nhấn nhanh</h3>
          <ul class="news-detail-keypoints">
            ${highlights}
          </ul>
        </div>
        <div class="news-detail-aside-card">
          <h3>Thông tin bài viết</h3>
          <div class="news-detail-quickinfo">
            <div><strong>Chủ đề</strong><span>${news.category || 'Tin Tức'}</span></div>
            <div><strong>Tác giả</strong><span>${news.author || 'BIT FC'}</span></div>
            <div><strong>Ngày xuất bản</strong><span>${dateStr}</span></div>
            <div><strong>Thời gian đọc</strong><span>${readTime}</span></div>
          </div>
        </div>
      </aside>
    </div>
  `;
  
  // Đổi title thẻ tab trình duyệt cho ngầu
  document.title = `${news.title} - BIT FC`;
};

const initNewsDetailPage = async () => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  if (!id) {
    renderNewsNotFound();
    return;
  }

  // Lấy dữ liệu từ Firestore dựa trên ID
  const news = await getNewsById(id);
  if (news.error || news.status !== 'published') {
    renderNewsNotFound();
    return;
  }

  renderNewsDetail(news);
};

document.addEventListener('DOMContentLoaded', initNewsDetailPage);