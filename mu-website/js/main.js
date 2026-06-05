/* ============================================================
   BIT FC - GLOBAL JS & 3D SLIDER
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {


// ---- PRELOADER ----
const preloader = document.getElementById('preloader');
if (preloader) {
  const hidePreloader = () => preloader.classList.add('hidden');

  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 800);
  } else {
    window.addEventListener('load', () => setTimeout(hidePreloader, 800));
    setTimeout(hidePreloader, 3500);
  }
}

  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- MOBILE NAV ----
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- ACTIVE NAV LINK ----
  const currentPath = window.location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
    const linkPath = link.getAttribute('href')?.replace(/\/+$/, '');
    if (linkPath && currentPath.endsWith(linkPath) && linkPath !== '') {
      link.classList.add('active');
    } else if ((currentPath.endsWith('index') || currentPath === '' || currentPath.endsWith('/')) && linkPath === 'index.html') {
      link.classList.add('active');
    }
  });

  // ---- SCROLL FADE-IN ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ---- HERO PARTICLES ----
  const particles = document.querySelector('.hero-particles');
  if (particles) {
    for (let i = 0; i < 25; i++) {
      const span = document.createElement('span');
      span.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-duration: ${5 + Math.random() * 10}s;
        animation-delay: ${Math.random() * 6}s;
        width: ${1 + Math.random() * 3}px;
        height: ${1 + Math.random() * 3}px;
        opacity: ${0.2 + Math.random() * 0.6};
      `;
      particles.appendChild(span);
    }
  }

  // ============================================================
  // ---- 3D COVERFLOW SLIDER LOGIC ----
  // ============================================================
  const playersData = [
    {
      number: '8',
      name: 'Bruno Fernandes',
      pos: 'Tiền Vệ Công',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896330/media_102559977_102167101.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Bruno Fernandes'
    },
    {
      number: '30',
      name: 'Benjamin Šeško',
      pos: 'Tiền Đạo',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896326/media_102559907_102167031.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Benjamin Šeško'
    },
    {
      number: '11',
      name: 'Joshua Zirkzee',
      pos: 'Tiền Đạo / Cánh',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896326/media_102559902_102167028.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Joshua Zirkzee'
    },
    {
      number: '37',
      name: 'Kobbie Mainoo',
      pos: 'Tiền Vệ Trung Tâm',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896330/media_102559979_102167103.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Kobbie Mainoo'
    },
    {
      number: '7',
      name: 'Mason Mount',
      pos: 'Tiền Vệ Trung Tâm',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896330/media_102559976_102167100.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Mason Mount'
    },
    {
      number: '5',
      name: 'Harry Maguire',
      pos: 'Hậu Vệ Trung Tâm',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896325/media_102559861_102166984.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Harry Maguire'
    },
    {
      number: '24',
      name: 'Senne Lammens',
      pos: 'Thủ Môn',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896327/media_102559948_102167072.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Senne Lammens'
    },
    {
      number: '15',
      name: 'Leny Yoro',
      pos: 'Hậu Vệ Trung Tâm',
      img: 'https://dynamic-crop-cdn.scoreplay.io/472/4896325/media_102559869_102166993_compressed.jpg?fmt=webp&f=center&w=600&h=818',
      alt: 'Leny Yoro'
    }
  ];

  const track = document.getElementById('player-track');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (track) {
    const totalPlayers = playersData.length;
    let currentIndex = Math.floor(totalPlayers / 2);

    // 1. Tạo HTML (Đã bổ sung thẻ shine-container cho hiệu ứng ánh sáng)
    track.innerHTML = playersData.map((player, index) => `
      <div class="player-3d-card" data-index="${index}">
        <div class="glass-card">
          <div class="glass-card-bg"></div>
          
          <div class="shine-container">
            <div class="shine-layer"></div>
          </div>

          <div class="player-3d-number">
            <div class="player-3d-number-inner">
              <span>${player.number}</span>
            </div>
          </div>
          <div class="player-3d-img-wrap">
            <img src="${player.img}" alt="${player.alt}" onerror="this.src='../assessts/logoBit.png';">
          </div>
          <div class="player-3d-info">
            <div class="player-3d-info-inner">
              <h3>${player.name}</h3>
              <div class="player-3d-pos">
                <div class="line"></div>
                <p>${player.pos}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    const cards = document.querySelectorAll('.player-3d-card');

    // 2. Cập nhật Slide với Toán học Modulo (Chạy vô tận)
    const updateSlider = () => {
      cards.forEach((card, index) => {
        // Tính toán khoảng cách offset chạy vòng tròn
        let offset = (index - currentIndex) % totalPlayers;
        
        // Điều chỉnh offset để luôn phân bổ đều 2 bên (- và +)
        if (offset > Math.floor(totalPlayers / 2)) {
          offset -= totalPlayers;
        } else if (offset < -Math.floor(totalPlayers / 2)) {
          offset += totalPlayers;
        }

        const absOffset = Math.abs(offset);
        
        let translateX = 0, translateZ = 0, rotateY = 0;
        let scale = 1, blur = 0, opacity = 1;
        let zIndex = 20 - absOffset;

        if (offset === 0) {
          // Thẻ Active (Ở Giữa)
          card.classList.add('is-active');
        } else {
          // Thẻ vệ tinh
          card.classList.remove('is-active');
          const direction = offset > 0 ? 1 : -1;
          
          if (absOffset === 1) {
            translateX = 300 * direction; translateZ = -100; rotateY = -25 * direction; scale = 0.85; blur = 3;
          } else if (absOffset === 2) {
            translateX = 600 * direction; translateZ = -200; rotateY = -50 * direction; scale = 0.70; blur = 3;
          } else if (absOffset === 3) {
            translateX = 900 * direction; translateZ = -300; rotateY = -75 * direction; scale = 0.55; blur = 3; opacity = 0; 
          } else {
            // Các thẻ bị giấu phía sau cùng (di chuyển tàng hình)
            translateX = 1200 * direction; translateZ = -400; scale = 0; opacity = 0;
          }
        }

        card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.zIndex = zIndex;
        card.style.filter = `brightness(${offset === 0 ? 1 : 0.4}) blur(${blur}px)`;
        card.style.opacity = opacity;
      });
    };

    // 3. Sự kiện Click (Áp dụng Modulo để + / - vô tận)
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        // Lùi vô tận
        currentIndex = (currentIndex - 1 + totalPlayers) % totalPlayers;
        updateSlider();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        // Tiến vô tận
        currentIndex = (currentIndex + 1) % totalPlayers;
        updateSlider();
      });
    }

    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        if (currentIndex !== index) {
          currentIndex = index;
          updateSlider();
        } else {
          const slug = playersData[index].name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/ /g, '-');
          
          window.location.href = `pages/player-detail.html?slug=${slug}`;
        }
      });
    });

    updateSlider();
  }
});