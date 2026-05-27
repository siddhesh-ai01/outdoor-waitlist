/* ==========================================================
   OUTDOOR — Theme Toggle
   Dark / Light mode with logo swap and localStorage persist
   ========================================================== */

(function () {
  const STORAGE_KEY = 'outdoor-theme';
  const DEFAULT = 'dark';

  const LOGOS = {
    dark:  'assets/images/logos/logo-dark.png',
    light: 'assets/images/logos/logo-light.png',
  };

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    // Swap logos
    ['header-logo', 'footer-logo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = LOGOS[theme];
    });
  }

  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return stored;
    // Always default to dark — Outdoor is a dark-first brand
    return DEFAULT;
  }

  // Apply on load (before paint to avoid flash)
  const initial = getInitialTheme();
  applyTheme(initial);

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || DEFAULT;
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Scroll → frosted header
    const header = document.getElementById('site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Scroll reveal — IntersectionObserver for .reveal elements
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach(el => observer.observe(el));
    } else {
      // Fallback: show all immediately
      revealEls.forEach(el => el.classList.add('visible'));
    }
  });
})();
