/* ════════════════════════════════════════════════════════════
   BIT FC DARK MATCH BOARD — JS
   File: js/match_board.js
════════════════════════════════════════════════════════════ */

import { listenAllMatches } from "../controllers/MatchController.js";
import { getAllPlayers } from "../controllers/PlayerController.js";

(async function () {
  'use strict';

  let allMatches = [];
  let allPlayers = [];
  try {
    const p = await getAllPlayers();
    allPlayers = Array.isArray(p) ? p : [];
  } catch (err) {
    console.error("Lỗi lấy cầu thủ", err);
  }

  listenAllMatches((matches) => {
    if (matches.error) {
      console.error(matches.error);
      allMatches = [];
    } else {
      allMatches = matches;
    }
    renderAll();
  });

  let remarkMatch = null;
  let publicMatches = [];
  let MB_SCORERS = [];
  let MB_MAX_GOALS = 1;
  let MB_TOTAL_GOALS = 1;
  let MB_NEXT_MATCH = new Date();

  function renderAll() {
    remarkMatch = allMatches.find(m => m.isRemark) || allMatches[0];
    publicMatches = allMatches.filter(m => m.isPublic).slice(0, 2);
    if (publicMatches.length === 0) publicMatches = allMatches.slice(0, 6);

    MB_SCORERS = allPlayers
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .map((p, idx) => ({
        r: idx + 1,
        name: p.name,
        team: 'BIT FC',
        goals: p.goals,
        games: p.appearances || 0,
        gold: idx === 0
      }));

    MB_MAX_GOALS   = MB_SCORERS.length ? MB_SCORERS[0].goals : 1;
    MB_TOTAL_GOALS = MB_SCORERS.reduce((a, s) => a + s.goals, 0) || 1;

    if (remarkMatch && remarkMatch.date) {
      const dParts = remarkMatch.date.split('-');
      const tParts = (remarkMatch.time || "00:00").split(':');
      if (dParts.length === 3) {
        MB_NEXT_MATCH = new Date(dParts[0], dParts[1] - 1, dParts[2], tParts[0] || 0, tParts[1] || 0, 0);
      } else {
        MB_NEXT_MATCH = new Date("invalid");
      }
    }
    
    // Update view if already initialized
    if (window.mbIsInit) {
      bindRemarkMatch();
      buildStd();
      makeTrack('mb-track1', 'mb-dots1', () => window.c1||0, v => window.c1 = v);
      if (document.getElementById('mb-p-std') && document.getElementById('mb-p-std').style.display !== 'none') {
        makeTrack('mb-track2', 'mb-dots2', () => window.c2||0, v => window.c2 = v);
      }
      startCD(); // Khởi động lại đếm ngược/tỉ số
    }
  }

  /* ── HELPERS ── */
  const p2  = n  => String(n).padStart(2, '0');
  const $   = id => document.getElementById(id);
  const per = () => window.innerWidth <= 480 ? 1 : 2;

  // Render HTML SVG fallback cho Logo
  function getLogoHtml(logoUrl, shortName, isHome) {
    if (logoUrl) return `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;transform:scale(1.2);" />`;
    const bg = isHome ? "#DA291C" : "#1a1a2e";
    return `
      <svg viewBox="0 0 62 62" xmlns="http://www.w3.org/2000/svg">
        <circle cx="31" cy="31" r="29" fill="${bg}"/>
        <circle cx="31" cy="31" r="23" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text x="31" y="34" font-family="Oswald,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">${shortName || '??'}</text>
      </svg>
    `;
  }

  // Đổ dữ liệu vào Remark Card trên HTML
  function bindRemarkMatch() {
    if (!remarkMatch) {
      const rmCard = $('mb-remark-card');
      if (rmCard) rmCard.style.display = 'none';
      return;
    }
    
    const rmCard = $('mb-remark-card');
    if (rmCard) rmCard.style.display = 'block';

    if ($('rm-home-bar')) $('rm-home-bar').textContent = remarkMatch.home;
    if ($('rm-away-bar')) $('rm-away-bar').textContent = remarkMatch.away;
    if ($('rm-home-name')) $('rm-home-name').textContent = remarkMatch.home;
    if ($('rm-away-name')) $('rm-away-name').textContent = remarkMatch.away;
    
    if ($('rm-home-logo-wrap')) $('rm-home-logo-wrap').innerHTML = getLogoHtml(remarkMatch.homeLogo, remarkMatch.homeShort, true);
    if ($('rm-away-logo-wrap')) $('rm-away-logo-wrap').innerHTML = getLogoHtml(remarkMatch.awayLogo, remarkMatch.awayShort, false);

    const dStr = (remarkMatch.date||"").split('-').reverse().join('/');
    if ($('rm-datetime')) $('rm-datetime').innerHTML = `${dStr}<br/>${remarkMatch.time||""} · ${remarkMatch.venue||""}`;
  }

  /* ── COUNTDOWN (flip digit) ── */
  const _prev = { d: null, h: null, m: null, s: null };

  function flipDigit(id, val) {
    const el = $(id); if (!el) return;
    const v  = p2(val);
    const k  = id.replace('mb-', '');
    if (_prev[k] === v) return;
    el.classList.add('mb-flip');
    setTimeout(() => { el.textContent = v; el.classList.remove('mb-flip'); }, 110);
    _prev[k] = v;
  }

  function startCD() {
    if (!remarkMatch) return;
    
    const cdCenter = document.querySelector('.mb-cd-center');
    if (!cdCenter) return;
    
    let scoreDiv = document.getElementById('mb-cd-score');
    if (!scoreDiv) {
      scoreDiv = document.createElement('div');
      scoreDiv.id = 'mb-cd-score';
      scoreDiv.style.fontFamily = 'var(--mb-fd)';
      scoreDiv.style.fontSize = '3.5rem';
      scoreDiv.style.fontWeight = '700';
      scoreDiv.style.color = '#fff';
      scoreDiv.style.letterSpacing = '4px';
      scoreDiv.style.textAlign = 'center';
      scoreDiv.style.margin = '5px 0';
      scoreDiv.style.display = 'none';
      
      const cdRow = document.querySelector('.mb-cd-row');
      if (cdRow) cdRow.parentNode.insertBefore(scoreDiv, cdRow.nextSibling);
    }

    function tick() {
      const diff = MB_NEXT_MATCH - Date.now();
      const label = document.querySelector('.mb-cd-label');
      const row = document.querySelector('.mb-cd-row');
      const scoreEl = document.getElementById('mb-cd-score');
      
      if (isNaN(diff)) {
        if (label) label.textContent = 'Bắt đầu sau';
        if (row) row.style.display = 'flex';
        if (scoreEl) scoreEl.style.display = 'none';
        ['mb-d', 'mb-h', 'mb-m', 'mb-s'].forEach(id => { const e = $(id); if (e) e.textContent = '00'; });
        return;
      }

      if (diff <= 0) {
        if (label) label.textContent = 'TỈ SỐ';
        if (row) row.style.display = 'none';
        if (scoreEl) {
          scoreEl.style.display = 'block';
          scoreEl.textContent = remarkMatch.score || "? - ?";
        }
        return;
      }
      
      if (label) label.textContent = 'Bắt đầu sau';
      if (row) row.style.display = 'flex';
      if (scoreEl) scoreEl.style.display = 'none';
      
      flipDigit('mb-d', Math.floor(diff / 864e5));
      flipDigit('mb-h', Math.floor(diff % 864e5 / 36e5));
      flipDigit('mb-m', Math.floor(diff % 36e5  / 6e4));
      flipDigit('mb-s', Math.floor(diff % 6e4   / 1e3));
    }
    
    if (window.cdInterval) clearInterval(window.cdInterval);
    tick();
    window.cdInterval = setInterval(tick, 1000);
  }

  /* ── BUILD STANDINGS ── */
  function buildStd() {
    const b = $('mb-std-body'); if (!b) return;
    b.innerHTML = '';
    MB_SCORERS.forEach((p, i) => {
      const pct  = Math.round((p.goals / MB_TOTAL_GOALS) * 100);
      const barW = Math.round((p.goals / MB_MAX_GOALS) * 100);
      const isG  = p.gold;
      const row  = document.createElement('div');
      row.className     = 'mb-std-row' + (isG ? ' mb-me' : '');
      row.style.animationDelay = (i * .07) + 's';
      row.innerHTML = `
        <span class="mb-rk${i < 3 ? ' mb-hi' : ''}">${p.r}</span>
        <span>
          <div class="mb-club-cell">
            <div class="mb-clogo">${p.name.split(' ').pop().slice(0, 2).toUpperCase()}</div>
            <div>
              <div class="mb-cname${isG ? ' mb-me' : ''}">${p.name}</div>
              <div style="font-size:.6rem;color:#6b3333;letter-spacing:.08em;">${p.team}</div>
            </div>
          </div>
        </span>
        <span>
          <div class="mb-bar-cell">
            <div class="mb-bar-top">
              <span class="mb-bar-goals" style="color:${isG ? '#FBE122' : '#DA291C'}">${p.goals}</span>
              <span class="mb-bar-pct"   style="color:${isG ? 'rgba(251,225,34,.75)' : 'rgba(218,41,28,.7)'}">${pct}%</span>
            </div>
            <div class="mb-bar-wrap">
              <div class="mb-bar-fill${isG ? ' mb-gold' : ''}" data-idx="${i}" style="width:0%"></div>
            </div>
          </div>
        </span>
        <span class="mb-bar-games">${p.games}</span>
      `;
      b.appendChild(row);
      setTimeout(() => {
        const fill = b.querySelector(`[data-idx="${i}"]`);
        if (fill) fill.style.width = barW + '%';
      }, 150 + i * 90);
    });
  }

  /* ── SLIDER ── */
  let c1 = 0, c2 = 0;

  function makeTrack(tid, did, getCur, setCur) {
    const tr = $(tid), dt = $(did); if (!tr || !dt) return;
    tr.innerHTML = ''; dt.innerHTML = '';
    const p     = per();
    const pages = Math.ceil(publicMatches.length / p);
    
    publicMatches.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'mb-rc';
      card.style.flex = `0 0 calc(${100 / p}% - ${(p - 1) * 12 / p}px)`;
      card.style.animationDelay = (idx * .06) + 's';
      
      const homeLogo = m.homeLogo ? `<img src="${m.homeLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;transform:scale(1.25);" />` : `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#DA291C"/><text x="14" y="18" font-family="Oswald" font-size="7" font-weight="700" fill="#fff" text-anchor="middle">${m.homeShort||''}</text></svg>`;
      const awayLogo = m.awayLogo ? `<img src="${m.awayLogo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;transform:scale(1.25);" />` : `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#1a1a2e"/><text x="14" y="18" font-family="Oswald" font-size="7" font-weight="700" fill="#fff" text-anchor="middle">${m.awayShort||''}</text></svg>`;
      
      const dStr = (m.date||"").split('-').reverse().join('/');
      let resText = "Chưa rõ", resClass = "";
      if(m.result === 'w'){ resText = "Thắng"; resClass = "w"; }
      if(m.result === 'd'){ resText = "Hòa"; resClass = "d"; }
      if(m.result === 'l'){ resText = "Thua"; resClass = "l"; }

      card.innerHTML = `
        <div class="mb-rc-top">${dStr}</div>
        <div class="mb-rc-comp">${m.comp}</div>
        <div class="mb-rc-body">
          <div class="mb-rc-logo">${homeLogo}</div>
          <div class="mb-rc-tname">${m.home}</div>
          <div class="mb-rc-score">${m.score||"-"}</div>
          <div class="mb-rc-tname mb-r">${m.away}</div>
          <div class="mb-rc-logo">${awayLogo}</div>
        </div>
        <div class="mb-rc-foot">
          <span class="mb-rc-ven">${m.venue||""}</span>
          <span class="mb-badge ${resClass}">${resText}</span>
        </div>
      `;
      tr.appendChild(card);
    });

    for (let i = 0; i < pages; i++) {
      const d  = document.createElement('div');
      d.className = 'mb-dot' + (i === 0 ? ' mb-on' : '');
      d.onclick   = (function (pp) { return function () { goTo(tid, did, pp, getCur, setCur); }; })(i);
      dt.appendChild(d);
    }
    goTo(tid, did, 0, getCur, setCur);
  }

  function goTo(tid, did, p, getCur, setCur) {
    const pv    = per();
    const pages = Math.ceil(publicMatches.length / pv);
    p = Math.max(0, Math.min(p, pages - 1));
    setCur(p);
    const cards = document.querySelectorAll('#' + tid + ' .mb-rc');
    if (!cards.length) return;
    const step = (cards[0].offsetWidth + 12) * pv;
    $(tid).style.transform = 'translateX(-' + (p * step) + 'px)';
    document.querySelectorAll('#' + did + ' .mb-dot')
      .forEach((d, i) => d.className = 'mb-dot' + (i === p ? ' mb-on' : ''));
  }

  window.mbSlide1 = function (dir) { goTo('mb-track1', 'mb-dots1', c1 + dir, () => c1, v => c1 = v); };
  window.mbSlide2 = function (dir) { goTo('mb-track2', 'mb-dots2', c2 + dir, () => c2, v => c2 = v); };

  /* ── TAB SWITCH (fade) ── */
  window.mbSw = function (tab) {
    const isM = tab === 'match';
    const pm = $('mb-p-match'), ps = $('mb-p-std');
    const tm = $('mb-t-match'), ts = $('mb-t-std');
    const hide = isM ? ps : pm, show = isM ? pm : ps;

    hide.style.transition = 'opacity .18s'; hide.style.opacity = '0';
    setTimeout(() => {
      hide.style.display = 'none';
      show.style.display = 'block'; show.style.opacity = '0';
      void show.offsetHeight;
      show.style.transition = 'opacity .22s'; show.style.opacity = '1';
      if (!isM) { buildStd(); makeTrack('mb-track2', 'mb-dots2', () => c2, v => c2 = v); }
    }, 160);

    if (tm) tm.className = 'mb-tb mb-left'  + (isM ? '' : ' mb-off');
    if (ts) ts.className = 'mb-tb mb-right' + (isM ? '' : ' mb-act');
  };

  /* ── SWIPE ── */
  function addSwipe(outerSel, slideFn) {
    const el = document.querySelector(outerSel); if (!el) return;
    let sx = 0;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 36) slideFn(dx < 0 ? 1 : -1);
    });
  }

  /* ── SCROLL REVEAL ── */
  function initReveal() {
    const el = $('mbCol'); if (!el) return;
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { el.classList.add('mb-visible'); obs.disconnect(); }
      }, { threshold: .08 });
      obs.observe(el);
    } else {
      el.classList.add('mb-visible');
    }
  }

  /* ── RESIZE ── */
  let mbResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(mbResizeTimer);
    mbResizeTimer = setTimeout(function () {
      makeTrack('mb-track1', 'mb-dots1', () => c1, v => c1 = v);
      if ($('mb-p-std') && $('mb-p-std').style.display !== 'none') {
        makeTrack('mb-track2', 'mb-dots2', () => c2, v => c2 = v);
      }
    }, 200);
  });

  /* ── INIT ── */
  function init() {
    window.mbIsInit = true;
    if (!$('mbCol')) return;
    bindRemarkMatch();
    mbSw('match');
    makeTrack('mb-track1', 'mb-dots1', () => c1, v => c1 = v);
    startCD();
    initReveal();
    addSwipe('#mb-track1', window.mbSlide1);
    addSwipe('#mb-track2', window.mbSlide2);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
