import { listenAllGalleryItems } from "../controllers/GalleryController.js";
import { listenAllPhotos } from "../controllers/PhotoController.js";

const galleryContainer = document.getElementById("gallery-masonry-container");
const filterBtns = document.querySelectorAll(".gallery-filter-btn");

// Lightbox DOM
const lightbox = document.getElementById("lightbox");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideoContainer = document.getElementById("lightbox-video-container");
const lightboxIframe = document.getElementById("lightbox-iframe");
const btnPrev = document.getElementById("lightbox-prev");
const btnNext = document.getElementById("lightbox-next");

// STATE
let allVideos = [];
let allPhotos = [];
let allMediaList = []; // Merged and sorted array
let currentFilteredList = []; // The list currently displayed
let currentLightboxIndex = 0;
let currentFilter = "all";

// Lấy Thumbnail YouTube
function getYouTubeThumbnail(id) {
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

// Hàm lấy timestamp từ Firestore field
function getTimestamp(doc) {
  if (!doc.createdAt) return 0;
  if (doc.createdAt.toMillis) return doc.createdAt.toMillis();
  if (doc.createdAt.seconds) return doc.createdAt.seconds * 1000;
  return new Date(doc.createdAt).getTime() || 0;
}

function initGallery() {
  // Parse URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam) {
    currentFilter = filterParam;
    filterBtns.forEach(b => {
      if (b.dataset.filter === filterParam) b.classList.add("active");
      else b.classList.remove("active");
    });
  }

  galleryContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--gray-mid);"><div class="spinner"></div> Đang tải dữ liệu...</div>`;

  // Listen to Videos
  listenAllGalleryItems((res) => {
    if (!res.error) allVideos = res.map(v => ({ ...v, mediaType: 'video' }));
    mergeAndRender();
  });

  // Listen to Photos
  listenAllPhotos((res) => {
    if (!res.error) allPhotos = res.map(p => ({ ...p, mediaType: 'photo' }));
    mergeAndRender();
  });
  
  setupFilters();
  setupLightbox();
}

function mergeAndRender() {
  // Merge and sort descending by date
  allMediaList = [...allVideos, ...allPhotos].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  applyFilterAndRender();
}

function applyFilterAndRender() {
  if (currentFilter === "all") {
    currentFilteredList = allMediaList;
  } else {
    currentFilteredList = allMediaList.filter(item => item.mediaType === currentFilter);
  }

  renderGallery(currentFilteredList);
}

function renderGallery(items) {
  if (!items || items.length === 0) {
    galleryContainer.innerHTML = `
      <div id="team-empty-msg" style="grid-column: 1 / -1; text-align: center; min-height: 40vh; padding-top: 100px; color: var(--gray-mid); font-family: var(--font-condensed); font-size: 1.2rem; letter-spacing: 0.15em; text-transform: uppercase;">
        Chưa có dữ liệu
      </div>`;
    return;
  }

  galleryContainer.classList.remove("flash-update");
  void galleryContainer.offsetWidth; // trigger reflow
  galleryContainer.classList.add("flash-update");

  let html = '';
  items.forEach((item, index) => {
    const isVideo = item.mediaType === 'video';
    const thumbUrl = item.thumbnail || (isVideo ? getYouTubeThumbnail(item.videoId) : item.url);
    const title = item.title || 'Untitled';
    const tag = item.tag || '';
    
    html += `
      <div class="gallery-item fade-in" data-index="${index}">
        <img src="${thumbUrl}" alt="${title}" loading="lazy" onerror="this.src='../assessts/logoBit.png';" />
        ${isVideo ? '<div class="vid-badge">▶</div>' : ''}
        <div class="gallery-overlay">
          <div class="g-tag">${isVideo ? 'Video' : 'Photo'} ${tag ? '· ' + tag : ''}</div>
          <div class="g-title">${title}</div>
        </div>
      </div>
    `;
  });

  galleryContainer.innerHTML = html;

  // Hiệu ứng Fade In
  setTimeout(() => {
    document.querySelectorAll(".gallery-item.fade-in").forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), i * 40);
    });
    
    attachItemEvents();
  }, 50);
}

function setupFilters() {
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      currentFilter = btn.dataset.filter;
      applyFilterAndRender();
      
      // Update URL without reloading
      const url = new URL(window.location);
      if (currentFilter === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", currentFilter);
      window.history.pushState({}, '', url);
    });
  });
}

function attachItemEvents() {
  const itemsDOM = document.querySelectorAll('.gallery-item');
  itemsDOM.forEach(item => {
    item.addEventListener('click', () => {
      currentLightboxIndex = parseInt(item.dataset.index, 10);
      showLightboxItem(currentLightboxIndex);
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  });
}

function showLightboxItem(index) {
  const item = currentFilteredList[index];
  if (!item) return;

  if (item.mediaType === 'video') {
    lightboxImg.style.display = 'none';
    lightboxVideoContainer.style.display = 'block';
    lightboxIframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1`;
  } else {
    lightboxVideoContainer.style.display = 'none';
    lightboxIframe.src = "";
    lightboxImg.src = item.url;
    lightboxImg.style.display = 'block';
  }
}

function navigateLightbox(direction) {
  if (currentFilteredList.length === 0) return;
  currentLightboxIndex += direction;
  
  // Loop
  if (currentLightboxIndex < 0) currentLightboxIndex = currentFilteredList.length - 1;
  if (currentLightboxIndex >= currentFilteredList.length) currentLightboxIndex = 0;
  
  showLightboxItem(currentLightboxIndex);
}

function setupLightbox() {
  lightboxClose.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.style.overflow = 'auto';
  setTimeout(() => {
    lightboxIframe.src = "";
    lightboxImg.src = "";
  }, 300);
}

document.addEventListener("DOMContentLoaded", initGallery);
