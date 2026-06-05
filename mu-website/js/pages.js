/* ============================================================
   CHELSEA FC - PAGE JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // TEAM FILTERS
  // ============================================================
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  const teamCards = document.querySelectorAll('.team-card[data-category]');

  if (filterBtns.length && teamCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        teamCards.forEach(card => {
          const match = f === 'all' || card.dataset.category === f;
          card.style.display = match ? '' : 'none';
          if (match) {
            card.style.animation = 'fadeInUp 0.4s ease both';
            setTimeout(() => card.style.animation = '', 500);
          }
        });
      });
    });
  }

  // ============================================================
  // GALLERY FILTERS
  // ============================================================
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn[data-filter]');
  const galleryItems = document.querySelectorAll('.gallery-item[data-type]');

  if (galleryFilterBtns.length && galleryItems.length) {
    galleryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        galleryFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        galleryItems.forEach(item => {
          const match = f === 'all' || item.dataset.type === f;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  }

  // ============================================================
  // LIGHTBOX
  // ============================================================
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox) {
    document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
      item.addEventListener('click', () => {
        lightboxImg.src = item.dataset.src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => lightboxImg.src = '', 300);
    };

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }

  // ============================================================
  // NEWS LOAD MORE
  // ============================================================
  const loadMoreBtn = document.getElementById('load-more-news');
  const hiddenCards = document.querySelectorAll('.news-page-card.hidden-card');

  if (loadMoreBtn && hiddenCards.length) {
    loadMoreBtn.addEventListener('click', () => {
      hiddenCards.forEach(card => {
        card.classList.remove('hidden-card');
        card.style.animation = 'fadeInUp 0.5s ease both';
      });
      loadMoreBtn.style.display = 'none';
    });
  }

  // ============================================================
  // COUNTER ANIMATION (history stats)
  // ============================================================
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          let current = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current + suffix;
            if (current >= target) clearInterval(timer);
          }, 25);
          countObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => countObserver.observe(c));
  }

});
