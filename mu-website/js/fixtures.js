document.addEventListener('DOMContentLoaded', () => {

  const tabs     = document.querySelectorAll('.fixtures-tab');
  const sections = document.querySelectorAll('.fixtures-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      sections.forEach(sec => {
        if (sec.id === `tab-${target}`) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      });
      /*filterBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('.filter-btn[data-league="all"]').classList.add('active');
      applyLeagueFilter('all');*/
      const activeFilter = document.querySelector('.fixtures-filters .filter-btn.active');
      const currentLeague = activeFilter ? activeFilter.dataset.league : 'all';
      applyLeagueFilter(currentLeague);
    });
  });

  const filterBtns = document.querySelectorAll('.fixtures-filters .filter-btn');

  function applyLeagueFilter(league) {
    const activeSection = document.querySelector('.fixtures-section:not(.hidden)');
    if (!activeSection) return;
    const cards = activeSection.querySelectorAll('.fixture-card');
    cards.forEach(card => {
      if (league === 'all' || card.dataset.league === league) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    const monthHeaders = activeSection.querySelectorAll('.fixtures-month-header');
    monthHeaders.forEach(header => {
      let nextEl = header.nextElementSibling;
      let hasVisible = false;
      while (nextEl && !nextEl.classList.contains('fixtures-month-header')) {
        if (nextEl.classList.contains('fixture-card') && nextEl.style.display !== 'none') {
          hasVisible = true;
          break;
        }
        nextEl = nextEl.nextElementSibling;
      }
      header.style.display = hasVisible ? '' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyLeagueFilter(btn.dataset.league);
    });
  });

  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(el => observer.observe(el));
  }

});