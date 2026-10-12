/* ==========================================================
   OUTDOOR — Kick-off countdown (first visit to Home only)
   "KICK-OFF IN 3 · 2 · 1 · GO", then the cover wipes up. The <head> script
   adds html.intro only on a first visit without reduced motion; any tap, key
   or scroll ends it early, and reveals wait until it has gone.
   ========================================================== */

import { holdReveals } from './motion.js';

const SEEN_KEY = 'outdoor-intro';

export function initIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  const el = document.querySelector('.intro-overlay');
  if (!el) { root.classList.remove('intro'); return; }
  root.classList.add('intro-js');
  holdReveals(true);

  const num = el.querySelector('[data-intro-num]');
  const dots = el.querySelectorAll('[data-intro-dot]');
  const steps = ['3', '2', '1', 'GO'];
  let i = 0, done = false, timer = 0;

  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* private mode */ }
    const wipe = el.animate
      ? el.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 800, easing: 'cubic-bezier(0.76,0,0.24,1)', fill: 'forwards' })
      : null;
    setTimeout(() => holdReveals(false), 260);
    const end = () => { root.classList.remove('intro', 'intro-js'); el.remove(); };
    if (wipe) wipe.onfinish = end; else end();
  };

  const next = () => {
    if (done) return;
    if (i >= steps.length) { finish(); return; }
    num.textContent = steps[i];
    num.classList.toggle('is-go', steps[i] === 'GO');
    dots[i]?.classList.add('on');
    num.animate?.([
      { transform: 'scale(1.7)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(0.94)', opacity: 1 },
    ], { duration: 440, easing: 'cubic-bezier(0.33,1,0.68,1)', fill: 'forwards' });
    i++;
    timer = setTimeout(next, i === steps.length ? 560 : 440);
  };

  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((type) =>
    window.addEventListener(type, finish, { once: true, passive: true }));
  timer = setTimeout(next, 200);
}
