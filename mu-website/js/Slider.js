// Slider.js — ES Module, lấy dữ liệu cầu thủ từ Firebase
import { listenAllPlayers } from "../controllers/PlayerController.js";

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('player-track');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!track) return;

  // ── 0. Hiện loading state ──
  track.innerHTML = '<p style="color:var(--gray-mid); text-align:center; width:100%; padding:40px 0;">Đang tải đội hình...</p>';

  let currentIndex = -1; // -1 nghĩa là chưa khởi tạo
  let players = [];
  let cards = [];
  let isFirstLoad = true;

  // ── 1. Lắng nghe cầu thủ từ Firestore ──
  listenAllPlayers((result) => {
    if (!result || result.error || result.length === 0) {
      track.innerHTML = '<p style="color:var(--red-mid); text-align:center; width:100%; padding:40px 0;">Không thể tải đội hình.</p>';
      return;
    }

    function formatLongName(name) {
      if (!name) return '';
      const words = name.trim().split(/\s+/);
      if (name.length > 15 && words.length >= 3) {
        words[0] = '...';
        return words.join(' ');
      }
      return name;
    }

    // Lọc những cầu thủ active/injured/suspend (giống team-public)
    const activeResult = result.filter(p => p.status === "active" || p.status === "injured" || p.status === "suspend");

    // Chuyển Firestore data → format phù hợp slider
    players = activeResult.map(p => ({
      id:     p.id,
      number: p.number ?? '',
      name:   p.name   ?? 'Cầu thủ',
      pos:    p.posLabel || p.pos || '',
      img:    p.imgUrl  || 'assessts/logoBit.png',
      alt:    p.name    || 'Cầu thủ',
    }));

    // Cố gắng giữ nguyên vị trí, nếu danh sách bị ngắn lại thì đưa về cuối
    if (currentIndex === -1) {
      currentIndex = Math.floor(players.length / 2);
    } else if (currentIndex >= players.length) {
      currentIndex = players.length - 1;
    }

    // ── 2. Khởi tạo HTML cho các thẻ cầu thủ ──
    track.innerHTML = players.map((player, index) => `
      <div class="player-3d-card" data-index="${index}">
        <div class="glass-card">
          <div class="glass-card-bg"></div>
          <div class="player-3d-number">
            <div class="player-3d-number-inner">
              <span>${player.number}</span>
            </div>
          </div>
          <div class="player-3d-img-wrap">
            <img src="${player.img}" alt="${player.alt}" loading="lazy" onerror="this.src='assessts/logoBit.png';">
          </div>
          <div class="player-3d-info">
            <div class="player-3d-info-inner">
              <h3>${formatLongName(player.name)}</h3>
              <div class="player-3d-pos">
                <div class="line"></div>
                <p>${player.pos}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    cards = document.querySelectorAll('.player-3d-card');
    
    // Khôi phục sự kiện click cho các thẻ
    cards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => {
        import("../controllers/PlayerController.js").then(m => {
          if (m.getPlayerById) m.getPlayerById(players[index].id);
        });
      }, { once: true });

      card.addEventListener('click', () => {
        if (currentIndex !== index) {
          currentIndex = index;
          updateSlider();
          resetAutoPlay();
        } else {
          const playerId = players[index].id;
          window.location.href = `pages/player-detail.html?id=${playerId}`;
        }
      });
    });

    if (!isFirstLoad) {
      track.classList.remove("flash-update");
      void track.offsetWidth;
      track.classList.add("flash-update");
    }
    isFirstLoad = false;

    updateSlider();
  });

  // ── 3. Hàm cập nhật hiệu ứng 3D Coverflow ──
  const updateSlider = () => {
    cards.forEach((card, index) => {
      let offset = index - currentIndex;
      
      // Xử lý offset theo vòng tròn (infinite loop)
      const half = Math.floor(players.length / 2);
      if (offset > half) {
        offset -= players.length;
      } else if (offset < -half) {
        offset += players.length;
      }
      
      const absOffset = Math.abs(offset);
      
      let translateX = 0;
      let translateZ = 0;
      let rotateY = 0;
      let scale = 1;
      let zIndex = 10 - absOffset;
      let blur = 0;
      let opacity = 1;

      if (offset === 0) {
        // Thẻ đang active (Chính giữa)
        translateX = 0;
        translateZ = 0;
        rotateY = 0;
        scale = 1;
        blur = 0;
        opacity = 1;
        card.classList.add('is-active');
      } else {
        // Các thẻ xung quanh
        card.classList.remove('is-active');
        const direction = offset > 0 ? 1 : -1;
        
        const isMobile = window.innerWidth <= 700;

        if (absOffset === 1) {
          translateX = (isMobile ? 80 : 300) * direction;
          translateZ = -100;
          rotateY = -25 * direction;
          scale = 0.85;
          blur = 3;
        } else if (absOffset === 2) {
          translateX = (isMobile ? 150 : 600) * direction;
          translateZ = -200;
          rotateY = -50 * direction;
          scale = 0.7;
          blur = 3;
        } else if (absOffset === 3) {
          translateX = (isMobile ? 220 : 900) * direction;
          translateZ = -300;
          rotateY = -75 * direction;
          scale = 0.55;
          blur = 3;
          opacity = 0; // Ẩn dần ở vị trí số 3
        } else {
          // Các thẻ nằm ngoài khung hình
          translateX = (isMobile ? 300 : 1200) * direction;
          translateZ = -400;
          scale = 0;
          opacity = 0;
        }
      }

      // Áp dụng CSS
      card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.zIndex = zIndex;
      card.style.filter = `brightness(${offset === 0 ? 1 : 0.5}) blur(${blur}px)`;
      card.style.opacity = opacity;
    });
  };

  // ── 4. Auto-play: tự chạy slider mỗi 4 giây ──
  const AUTO_PLAY_DELAY = 4000;
  let autoPlayTimer = null;

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % players.length; // Lặp vòng
      updateSlider();
    }, AUTO_PLAY_DELAY);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  };

  // Reset auto-play khi user tương tác
  const resetAutoPlay = () => {
    startAutoPlay();
  };

  // ── 5. Xử lý sự kiện Click ──
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + players.length) % players.length;
      updateSlider();
      resetAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % players.length;
      updateSlider();
      resetAutoPlay();
    });
  }



  // Gọi hàm chạy lần đầu + bắt đầu auto-play
  updateSlider();
  startAutoPlay();

  // Resize listener
  window.addEventListener('resize', () => {
    updateSlider();
  });
});