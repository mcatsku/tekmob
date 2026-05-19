/**
 * Tekmob - Tab switching and home two-pane scroll gate
 */
(function () {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  const home = document.getElementById('home');
  const homeViewport = document.getElementById('home-viewport');
  const homeTrack = document.getElementById('home-track');
  const heroInner = document.getElementById('home-hero-inner');
  const servicesScroll = document.getElementById('home-services-scroll');
  const homePaneHero = document.getElementById('home-pane-hero');
  const homePaneServices = document.getElementById('home-pane-services');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHEEL_THRESHOLD = reduceMotion ? 90 : 220;
  const MAX_PULL = 48;
  const PULL_GAIN = 0.2;

  let heroGate = 0;
  let servicesGate = 0;
  let decayHeroTimer = null;
  let decayServicesTimer = null;
  let touchStartY = null;
  let touchServicesStartY = null;

  function isHomeActive() {
    return home && home.classList.contains('active') && !home.hidden;
  }

  function isServicesPane() {
    return homeTrack && homeTrack.classList.contains('home-track--services');
  }

  function syncBodyLock() {
    document.body.classList.toggle('body--home-active', isHomeActive());
  }

  function setHeroPull(px) {
    if (!heroInner) return;
    heroInner.style.setProperty('--home-pull', px > 0 ? `${px}px` : '0px');
  }

  function setPullFromHeroGate() {
    setHeroPull(Math.min(MAX_PULL, heroGate * PULL_GAIN));
  }

  function clearDecayHero() {
    if (decayHeroTimer) clearTimeout(decayHeroTimer);
    decayHeroTimer = null;
  }

  function clearDecayServices() {
    if (decayServicesTimer) clearTimeout(decayServicesTimer);
    decayServicesTimer = null;
  }

  function scheduleDecayHero() {
    clearDecayHero();
    decayHeroTimer = setTimeout(() => {
      heroGate = 0;
      setHeroPull(0);
    }, 200);
  }

  function scheduleDecayServices() {
    clearDecayServices();
    decayServicesTimer = setTimeout(() => {
      servicesGate = 0;
    }, 200);
  }

  function updateHomeInert() {
    if (!homePaneHero || !homePaneServices || !homeViewport) return;
    if (isServicesPane()) {
      homePaneHero.setAttribute('inert', '');
      homePaneServices.removeAttribute('inert');
      homeViewport.classList.add('home-viewport--pane-services');
    } else {
      homePaneServices.setAttribute('inert', '');
      homePaneHero.removeAttribute('inert');
      homeViewport.classList.remove('home-viewport--pane-services');
    }
  }

  function goToServices() {
    if (!homeTrack) return;
    clearDecayHero();
    clearDecayServices();
    heroGate = 0;
    servicesGate = 0;
    setHeroPull(0);
    homeTrack.classList.add('home-track--services');
    updateHomeInert();
    if (servicesScroll) servicesScroll.scrollTop = 0;
  }

  function goToHero() {
    if (!homeTrack) return;
    clearDecayHero();
    clearDecayServices();
    heroGate = 0;
    servicesGate = 0;
    setHeroPull(0);
    homeTrack.classList.remove('home-track--services');
    updateHomeInert();
  }

  function onWheel(e) {
    if (!isHomeActive()) return;

    if (!isServicesPane()) {
      if (e.deltaY > 0) {
        e.preventDefault();
        clearDecayHero();
        heroGate += e.deltaY;
        setPullFromHeroGate();
        if (heroGate >= WHEEL_THRESHOLD) {
          goToServices();
        } else {
          scheduleDecayHero();
        }
      } else {
        e.preventDefault();
        heroGate = Math.max(0, heroGate + e.deltaY);
        setPullFromHeroGate();
        scheduleDecayHero();
      }
      return;
    }

    if (e.deltaY < 0 && servicesScroll && servicesScroll.scrollTop <= 0) {
      e.preventDefault();
      clearDecayServices();
      servicesGate += e.deltaY;
      if (servicesGate <= -WHEEL_THRESHOLD) {
        goToHero();
      } else {
        scheduleDecayServices();
      }
    }
  }

  function onTouchStart(e) {
    if (!isHomeActive() || isServicesPane() || !homeViewport) return;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!isHomeActive() || isServicesPane() || touchStartY == null) return;
    const y = e.touches[0].clientY;
    const dy = touchStartY - y;
    if (dy > 0) {
      e.preventDefault();
      clearDecayHero();
      heroGate = Math.min(WHEEL_THRESHOLD, dy * 2.4);
      setPullFromHeroGate();
      if (heroGate >= WHEEL_THRESHOLD) {
        goToServices();
        touchStartY = null;
      }
    }
  }

  function onTouchEnd() {
    if (!isHomeActive() || isServicesPane()) {
      touchStartY = null;
      return;
    }
    touchStartY = null;
    if (heroGate > 0 && heroGate < WHEEL_THRESHOLD) {
      scheduleDecayHero();
    }
  }

  function onServicesTouchStart(e) {
    if (!isHomeActive() || !isServicesPane()) return;
    touchServicesStartY = e.touches[0].clientY;
  }

  function onServicesTouchMove(e) {
    if (!isHomeActive() || !isServicesPane() || touchServicesStartY == null || !servicesScroll) return;
    if (servicesScroll.scrollTop > 0) return;
    const y = e.touches[0].clientY;
    const totalDy = y - touchServicesStartY;
    if (totalDy > 0) {
      e.preventDefault();
      clearDecayServices();
      servicesGate = -Math.min(WHEEL_THRESHOLD, totalDy * 2.2);
      if (servicesGate <= -WHEEL_THRESHOLD) {
        goToHero();
        touchServicesStartY = null;
      } else {
        scheduleDecayServices();
      }
    }
  }

  function onServicesTouchEnd() {
    touchServicesStartY = null;
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      tabPanels.forEach((panel) => {
        const isActive = panel.id === targetTab;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });

      goToHero();
      syncBodyLock();
      if (targetTab === 'home') {
        updateHomeInert();
      }
    });
  });

  if (servicesScroll) {
    servicesScroll.addEventListener('scroll', () => {
      if (servicesScroll.scrollTop > 4) {
        servicesGate = 0;
      }
    });
    servicesScroll.addEventListener('touchstart', onServicesTouchStart, { passive: true });
    servicesScroll.addEventListener('touchmove', onServicesTouchMove, { passive: false });
    servicesScroll.addEventListener('touchend', onServicesTouchEnd, { passive: true });
    servicesScroll.addEventListener('touchcancel', onServicesTouchEnd, { passive: true });
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  if (homeViewport) {
    homeViewport.addEventListener('touchstart', onTouchStart, { passive: true });
    homeViewport.addEventListener('touchmove', onTouchMove, { passive: false });
    homeViewport.addEventListener('touchend', onTouchEnd, { passive: true });
    homeViewport.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  window.addEventListener('keydown', (e) => {
    if (!isHomeActive()) return;
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
    if (t instanceof HTMLAnchorElement || t instanceof HTMLButtonElement) return;
    if (e.key === 'ArrowDown' && !isServicesPane()) {
      e.preventDefault();
      goToServices();
    } else if (e.key === 'ArrowUp' && isServicesPane() && servicesScroll && servicesScroll.scrollTop <= 0) {
      e.preventDefault();
      goToHero();
    }
  });

  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      const homeBtn = document.querySelector('[data-tab="home"]');
      if (!homeBtn) return;
      if (homeBtn.classList.contains('active')) {
        goToHero();
        updateHomeInert();
      } else {
        homeBtn.click();
      }
    });
  }

  syncBodyLock();
  updateHomeInert();
})();
