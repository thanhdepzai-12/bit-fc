import { listenPhotosLimited } from "../controllers/PhotoController.js";

const grid = document.getElementById("home-photos-grid");
let photoList = [];
let currentIndex = 0;

function initHomePhotos() {
  if (!grid) return;

  grid.innerHTML = '<p style="column-span:all; text-align:center; color:#a1a1aa; padding:40px 0;">Đang tải ảnh...</p>';

  listenPhotosLimited(10, (photos) => {
    if (photos.error) {
      console.error(photos.error);
      grid.innerHTML = '<p style="column-span:all; text-align:center; color:var(--red-mid);">Lỗi tải dữ liệu.</p>';
      return;
    }

    if (!photos || photos.length === 0) {
      grid.innerHTML = '<p style="column-span:all; text-align:center; color:#a1a1aa; padding:40px 0;">Chưa có ảnh nào.</p>';
      return;
    }

    // Shuffle array cho hiệu ứng random
    photoList = [...photos].sort(() => Math.random() - 0.5);

    grid.innerHTML = "";

    photoList.forEach((p, index) => {
      const item = document.createElement("div");
      item.className = "gallery-preview-item fade-in";
      item.innerHTML = `
        <img src="${p.url}" alt="${p.title || 'BIT FC'}" loading="lazy" onerror="this.src='assessts/logoBit.png';" />
      `;
      // Thêm event mở lightbox
      item.addEventListener("click", () => openLightbox(index));
      
      grid.appendChild(item);

      setTimeout(() => {
        item.classList.add("visible");
      }, Math.min(index * 80, 800));
    });
  });

  setupLightboxHTML();
}

// ── LIGHTBOX LOGIC ──
function setupLightboxHTML() {
  if (document.getElementById("photo-lightbox")) return;

  const html = `
    <div class="photo-lightbox" id="photo-lightbox">
      <button class="lightbox-close" id="lightbox-close"><i class="ti ti-x">✕</i></button>
      <button class="lightbox-nav btn-prev" id="lightbox-prev">❮</button>
      <img id="lightbox-img" src="" alt="Photo" />
      <button class="lightbox-nav btn-next" id="lightbox-next">❯</button>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", (e) => { e.stopPropagation(); navigateLightbox(-1); });
  document.getElementById("lightbox-next").addEventListener("click", (e) => { e.stopPropagation(); navigateLightbox(1); });
  
  document.getElementById("photo-lightbox").addEventListener("click", (e) => {
    if (e.target === document.getElementById("photo-lightbox")) closeLightbox();
  });
}

function openLightbox(index) {
  if (photoList.length === 0) return;
  currentIndex = index;
  updateLightboxImage();
  document.getElementById("photo-lightbox").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("photo-lightbox").classList.remove("show");
  document.body.style.overflow = "";
  setTimeout(() => { document.getElementById("lightbox-img").src = ""; }, 300);
}

function navigateLightbox(dir) {
  if (photoList.length === 0) return;
  currentIndex += dir;
  if (currentIndex < 0) currentIndex = photoList.length - 1; // Loop quay về cuối
  if (currentIndex >= photoList.length) currentIndex = 0;    // Loop quay về đầu
  updateLightboxImage();
}

function updateLightboxImage() {
  const p = photoList[currentIndex];
  if (p && p.url) {
    document.getElementById("lightbox-img").src = p.url;
  }
}

document.addEventListener("DOMContentLoaded", initHomePhotos);
