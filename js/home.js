/* ==========================================================
   OUTDOOR — Home
   Hero field with the rotating LED mascot · the app's four jobs (sticky phone
   on desktop, swipe cards on phones) · sport tiles · waitlist.
   ========================================================== */

import './site.js';
import { initField, rasterize } from './field.js';
import { initCount, initForms } from './waitlist.js';
import { initIntro } from './intro.js';

initIntro();

const hero = document.querySelector('.hero');
if (hero) initField(hero, { silhouette: 'mascot', embers: 'all' });

initCount();
initForms();

/* ── One app, four jobs ────────────────────────────────────────── */
(function steps() {
  const phone = document.querySelector('[data-phone]');
  const items = document.querySelectorAll('[data-step]');
  if (!items.length || !('IntersectionObserver' in window)) return;

  const narrow = window.matchMedia('(max-width: 860px)');
  const dots = document.querySelectorAll('[data-step-dot]');
  const activate = (key) => {
    if (phone) phone.dataset.active = key;
    items.forEach((el) => el.classList.toggle('is-active', el.dataset.step === key));
    dots.forEach((d) => d.setAttribute('aria-current', String(d.dataset.stepDot === key)));
  };
  activate(items[0].dataset.step);

  // Desktop: the step crossing the middle of the viewport owns the sticky phone.
  const desktop = new IntersectionObserver((entries) => {
    if (narrow.matches) return;
    for (const e of entries) if (e.isIntersecting) activate(e.target.dataset.step);
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((el) => desktop.observe(el));

  // Phones: the steps become a swipe row; the card in view drives the phone and the dots.
  const track = document.querySelector('[data-steps-track]');
  if (track && dots.length) {
    const swipe = new IntersectionObserver((entries) => {
      if (!narrow.matches) return;
      for (const e of entries) if (e.intersectionRatio >= 0.6) activate(e.target.dataset.step);
    }, { root: track, threshold: [0.6] });
    items.forEach((el) => swipe.observe(el));
    dots.forEach((d) => d.addEventListener('click', () => {
      const card = track.querySelector(`[data-step="${d.dataset.stepDot}"]`);
      card?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
    }));
  }
})();

/* ── Sport tiles: small LED pictograms in each sport's colour ──── */
const unit = (fn) => (c, w, h) => { c.scale(w / 100, h / 100); fn(c); };
const rr = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); };
const pentagon = (c, x, y, r, rot) => {
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * 2 * Math.PI) / 5;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath(); c.fill();
};
const SHAPES = {
  cricket: unit((c) => {                                   // bat and ball
    c.save(); c.translate(45, 55); c.rotate(-0.42); c.translate(-50, -50);
    rr(c, 46.5, 4, 7, 31, 3.5);
    c.beginPath(); c.moveTo(45, 32); c.lineTo(55, 32); c.lineTo(60.5, 40); c.lineTo(39.5, 40); c.closePath(); c.fill();
    rr(c, 39.5, 38, 21, 56, 7);
    c.restore();
    c.beginPath(); c.arc(80, 21, 9, 0, Math.PI * 2); c.fill();
  }),
  football: unit((c) => {                                  // ball, panels dimmed
    c.beginPath(); c.arc(50, 50, 45, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = 'rgba(0,0,0,0.8)';
    pentagon(c, 50, 50, 14, -Math.PI / 2);
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + Math.PI / 5 + (k * 2 * Math.PI) / 5;
      pentagon(c, 50 + Math.cos(a) * 42, 50 + Math.sin(a) * 42, 12, a + Math.PI);
    }
  }),
  tennis: unit((c) => {                                    // racket and ball
    c.save(); c.translate(44, 50); c.rotate(0.5); c.translate(-50, -50);
    c.beginPath(); c.ellipse(50, 30, 22, 28, 0, 0, Math.PI * 2); c.moveTo(64, 30); c.ellipse(50, 30, 14, 20, 0, 0, Math.PI * 2, true); c.fill('evenodd');
    c.globalAlpha = 0.22; c.beginPath(); c.ellipse(50, 30, 14, 20, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(40, 55); c.lineTo(60, 55); c.lineTo(54, 69); c.lineTo(46, 69); c.closePath(); c.fill();
    rr(c, 45.5, 66, 9, 31, 3);
    c.restore();
    c.beginPath(); c.arc(82, 80, 9, 0, Math.PI * 2); c.fill();
  }),
  f1: unit((c) => {                                        // chequered flag on a pole
    rr(c, 14, 6, 7, 90, 3);
    const x0 = 21, y0 = 8, sq = 13.5;
    for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) {
      c.globalAlpha = (r + q) % 2 === 0 ? 1 : 0.22;
      c.fillRect(x0 + q * sq, y0 + r * sq + Math.sin(q * 0.9) * 3, sq, sq);
    }
    c.globalAlpha = 1;
  }),
  chess: unit((c) => {                                     // king
    rr(c, 46.5, 2, 7, 19, 1.5); rr(c, 40, 7.5, 20, 6.5, 1.5);
    c.beginPath(); c.moveTo(33, 21); c.lineTo(67, 21); c.lineTo(61, 38); c.lineTo(39, 38); c.closePath(); c.fill();
    rr(c, 36.5, 37, 27, 6.5, 2);
    c.beginPath(); c.moveTo(41.5, 43); c.lineTo(58.5, 43); c.lineTo(64, 78); c.lineTo(36, 78); c.closePath(); c.fill();
    rr(c, 30.5, 77, 39, 7.5, 2.5); rr(c, 25, 84, 50, 11, 3);
  }),
  more: unit((c) => {                                      // a plus, for the sports on the way
    rr(c, 42, 14, 16, 72, 6); rr(c, 14, 42, 72, 16, 6);
  }),
};

(function sportTiles() {
  const canvases = document.querySelectorAll('canvas[data-pictogram]');
  if (!canvases.length) return;
  const N = 13, CELL = 9;                 // a 13 × 13 LED panel, 117 px
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const maps = new Map();
  const tiles = [];

  const paint = (tile, progress) => {
    const { canvas, map, color } = tile;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = N * CELL;
    if (canvas.width !== size * dpr) { canvas.width = size * dpr; canvas.height = size * dpr; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const light = document.documentElement.dataset.theme === 'light';
    ctx.fillStyle = light ? 'rgba(10,10,10,0.12)' : 'rgba(242,237,232,0.14)';
    ctx.beginPath();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
      ctx.moveTo(x + 1.2, y); ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = color;
    for (let k = 0; k < map.length; k++) {
      const d = map[k];
      if (d < 0.06) continue;
      const c = k % N, r = (k / N) | 0;
      if ((c + r * 0.5) / (N * 1.5) > progress) continue;     // the lighting sweep
      const rad = d >= 0.72 ? 3.1 : d >= 0.45 ? 2.5 : d >= 0.2 ? 1.9 : 1.3;
      ctx.globalAlpha = Math.min(1, 0.45 + 0.55 * d);
      ctx.beginPath();
      ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const sweep = (tile) => {
    if (reduce.matches) { paint(tile, 1); return; }
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - start) / 520);
      paint(tile, p);
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  canvases.forEach((canvas) => {
    const key = canvas.dataset.pictogram;
    if (!maps.has(key)) maps.set(key, rasterize(N, N, SHAPES[key], 6));
    const tile = { canvas, map: maps.get(key), color: canvas.dataset.color };
    tiles.push(tile);
    paint(tile, 0);
    const card = canvas.closest('.sport');
    card?.addEventListener('pointerenter', () => sweep(tile));
    card?.addEventListener('focusin', () => sweep(tile));
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const tile = tiles.find((t) => t.canvas === e.target);
        if (tile) { setTimeout(() => sweep(tile), Number(e.target.dataset.delay) || 0); io.unobserve(e.target); }
      }
    }, { threshold: 0.6 });
    tiles.forEach((t) => io.observe(t.canvas));
  } else tiles.forEach((t) => paint(t, 1));
  document.addEventListener('outdoor:theme', () => tiles.forEach((t) => paint(t, 1)));
})();
