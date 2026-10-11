/* ==========================================================
   OUTDOOR — First-visit logo reveal
   The app's launch-splash Lottie (outdoor-app/assets/splash): the O and the
   door open into the wordmark. Like the app's handoff (UI guidelines §40), a
   still of frame 0 is on screen from the first paint, and the player takes
   over in the same pixels once it has loaded.

   Plays once per visitor, cut at frame 126 as the app does. Skipped under
   reduced motion, and any tap, key or scroll ends it early.
   The <head> script adds html.intro; nothing here runs without it.
   ========================================================== */

const LOTTIE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
const LOTTIE_SRI = 'sha384-Vtbz3QbtSBqleuQry6kQy5smig1gPZCXUoTFN7RmN9QW47xpEDsV/J1w0Pw0rDJu';
const SEEN_KEY = 'outdoor-intro';
const LAST_FRAME = 126;

function loadPlayer() {
  if (window.lottie) return Promise.resolve(window.lottie);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = LOTTIE_SRC;
    s.integrity = LOTTIE_SRI;
    s.crossOrigin = 'anonymous';
    s.onload = () => (window.lottie ? resolve(window.lottie) : reject(new Error('lottie missing')));
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function initIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  const overlay = document.getElementById('intro-overlay');
  const stage = document.getElementById('intro-stage');
  if (!overlay || !stage) { root.classList.remove('intro'); return; }

  let done = false;
  let anim = null;
  const finish = () => {
    if (done) return;
    done = true;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* private mode */ }
    root.classList.add('intro-out');
    setTimeout(() => {
      root.classList.remove('intro', 'intro-out');
      if (anim) anim.destroy();
      overlay.remove();
    }, 420);
  };

  // Never hold the page: if the player isn't running soon, show the site.
  const failsafe = setTimeout(finish, 1800);
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((type) =>
    window.addEventListener(type, finish, { once: true, passive: true }));

  const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
  const data = fetch(new URL(`../assets/lottie/splash-${theme}.json`, import.meta.url)).then((r) => r.json());

  Promise.all([loadPlayer(), data]).then(([lottie, animationData]) => {
    if (done) return;
    anim = lottie.loadAnimation({ container: stage, renderer: 'svg', loop: false, autoplay: false, animationData });
    anim.addEventListener('DOMLoaded', () => {
      if (done) return;
      clearTimeout(failsafe);
      stage.querySelector('.intro-still')?.remove();
      anim.play();
      setTimeout(finish, 3200);
    });
    anim.addEventListener('enterFrame', (e) => {
      if (e.currentTime >= LAST_FRAME) { anim.pause(); setTimeout(finish, 160); }
    });
  }).catch(finish);
}
