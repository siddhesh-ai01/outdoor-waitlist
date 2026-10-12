/* ==========================================================
   OUTDOOR — Home
   Kick-off countdown · LED board · live waitlist count · ticker loop ·
   manifesto slide · four quarters (horizontal rail on desktop, stacked on
   phones, demos on a 1.1s beat) · squad huddles · Lights out · Pune map.
   ========================================================== */

import './site.js';
import { onFrame, reduceMotion, narrow, clamp01, countUp, whenRevealed } from './motion.js';
import { led, squad } from './fx.js';
import { fetchCount } from './waitlist.js';
import { initIntro } from './intro.js';
import { INDIA, CITIES } from './india.js';

initIntro();
const root = document.documentElement;

/* ── Hero: the stadium board and the count ─────────────────────── */
const board = document.querySelector('[data-led]');
if (board) led(board, { messages: ["Let's get out humans", 'Follow · Book · Play', 'See you outside'], cell: () => (narrow.matches ? 10 : 14) });

const countWrap = document.querySelector('[data-count-wrap]');
const countEl = countWrap?.querySelector('[data-count]');
if (countEl) {
  fetchCount().then((n) => {
    if (!(n > 0)) return;                       // no number, no line
    countWrap.classList.remove('is-loading');
    whenRevealed(countWrap, () => countUp(countEl, n));
  });
}

/* ── Ticker: a second copy of each row makes the loop seamless ──── */
document.querySelectorAll('[data-ticker]').forEach((row) => {
  Array.from(row.children).forEach((pill) => row.append(pill.cloneNode(true)));
  row.classList.add('is-looping');
});

/* ── Manifesto: the lines slide against each other ─────────────── */
const slideSections = document.querySelectorAll('[data-slides]');
onFrame((vh) => {
  slideSections.forEach((sec) => {
    const lines = sec.querySelectorAll('[data-slide]');
    if (reduceMotion.matches) { lines.forEach((el) => { el.style.transform = ''; }); return; }
    const r = sec.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp01((vh - r.top) / (vh + r.height));
    lines.forEach((el) => { el.style.transform = `translateX(${((0.5 - p) * Number(el.dataset.slide) * 36).toFixed(2)}vw)`; });
  });
});

/* ── Four quarters ─────────────────────────────────────────────── */
(function quarters() {
  const sec = document.querySelector('[data-htrack]');
  if (!sec) return;
  const rail = sec.querySelector('[data-hrail]');
  const runner = sec.querySelector('[data-runner]');
  const lap = sec.querySelector('[data-lap]');

  // Desktop: vertical scroll drives the rail sideways, a runner laps the track.
  onFrame((vh) => {
    if (narrow.matches) { rail.style.transform = ''; return; }
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp01(-r.top / Math.max(1, r.height - vh));
    const travel = Math.max(0, rail.scrollWidth - root.clientWidth);
    rail.style.transform = `translateX(${(-p * travel).toFixed(1)}px)`;
    if (runner) runner.style.left = `${(p * 100).toFixed(2)}%`;
    if (lap) lap.textContent = String(Math.min(4, Math.floor(p * 4) + 1));
  });

  // The demos play on a beat while the section is on screen.
  const q1 = sec.querySelectorAll('[data-q1] .fchip');
  const q2 = sec.querySelectorAll('[data-q2] .slot');
  const toast = sec.querySelector('[data-q2] .q2-toast');
  const bubbles = sec.querySelectorAll('[data-q3] .bubble');
  const avs = sec.querySelectorAll('[data-q3] .av');
  const q3count = sec.querySelector('[data-q3-count]');
  const q3status = sec.querySelector('[data-q3-status]');
  const q4 = sec.querySelectorAll('[data-q4] .news');

  function beatTo(b) {
    const ph1 = b % 8;
    q1.forEach((chip, i) => {
      const on = ph1 > i;
      chip.classList.toggle('is-on', on);
      chip.classList.toggle('is-pop', on && ph1 === i + 1);
      chip.querySelector('.fchip-btn').textContent = on ? 'Following ✓' : 'Follow';
    });
    const ph2 = b % 6, booked = ph2 >= 3, sel = ph2 < 3 ? [1, 3, 6][ph2] : 6;
    q2.forEach((slot, i) => {
      slot.classList.toggle('is-booked', booked && i === 6);
      slot.classList.toggle('is-sel', !booked && i === sel);
    });
    toast?.classList.toggle('is-shown', booked);
    const ph3 = b % 8, count = Math.min(5, ph3 + 1);
    bubbles[0]?.classList.toggle('is-shown', ph3 >= 1);
    bubbles[1]?.classList.toggle('is-shown', ph3 >= 3);
    avs.forEach((av, i) => { const on = i < count; av.classList.toggle('is-on', on); av.textContent = on ? av.dataset.i : '+'; });
    if (q3count) {
      q3count.textContent = `${count}/5`;
      q3count.parentElement.classList.toggle('is-full', count >= 5);
    }
    if (q3status) q3status.textContent = count < 5 ? `Need ${5 - count} more for Sunday` : 'Squad full. See you Sunday.';
    const top = Math.floor(b / 2) % 3;
    q4.forEach((card, i) => {
      const pos = (i - top + 3) % 3;
      card.style.transform = pos ? `translateY(${pos * 15}px) scale(${1 - pos * 0.05})` : 'none';
      card.style.opacity = ['1', '0.6', '0.3'][pos];
      card.style.zIndex = String(3 - pos);
    });
  }

  let beat = 0, onScreen = false;
  beatTo(reduceMotion.matches ? 5 : 0);
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; }).observe(sec);
  else onScreen = true;
  setInterval(() => {
    if (!onScreen || document.hidden || reduceMotion.matches) return;
    beat += 1;
    beatTo(beat);
  }, 1100);
  reduceMotion.addEventListener?.('change', () => beatTo(reduceMotion.matches ? 5 : beat));
})();

/* ── Squad: dots gather into games as the section scrolls by ───── */
(function huddles() {
  const sec = document.querySelector('[data-squad]');
  const cv = sec?.querySelector('[data-squad-canvas]');
  if (!cv) return;
  const sq = squad(cv);
  onFrame((vh) => {
    if (reduceMotion.matches) { sq.set(1); return; }
    const r = sec.getBoundingClientRect();
    sq.set(clamp01((-r.top + vh * 0.15) / Math.max(1, r.height - vh * 1.1)));
  });
})();

/* ── Lights out: five red lights, then react ───────────────────── */
(function lightsOut() {
  const game = document.querySelector('[data-game]');
  if (!game) return;
  const columns = game.querySelectorAll('.lamps');
  const big = game.querySelector('[data-rx-big]');
  const msg = game.querySelector('[data-rx-msg]');
  const bestEl = document.querySelector('[data-best]');
  const KEY = 'outdoor-best';
  let best = null;
  try { const b = Number(localStorage.getItem(KEY)); if (b > 0) best = b; } catch (e) { /* private mode */ }
  let phase = 'idle', goAt = 0, timers = [];

  const verdict = (ms) => (ms < 200 ? 'Pole position' : ms < 280 ? 'Podium finish' : ms < 400 ? 'Points finish' : 'Back to the paddock');
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  function render(ms = 0, lit = 0) {
    columns.forEach((col, i) => col.classList.toggle('is-lit', phase === 'arming' && lit > i));
    big.classList.toggle('is-go', phase === 'go');
    big.classList.toggle('is-jump', phase === 'jump');
    big.textContent = { idle: '0.000', arming: 'READY', go: 'GO', jump: 'JUMP' }[phase] ?? (ms / 1000).toFixed(3);
    msg.textContent = {
      idle: 'Tap to start', arming: 'Wait for lights out', go: 'Tap now', jump: 'Jump start. Tap to try again',
    }[phase] ?? `${verdict(ms)} · tap to go again`;
    if (bestEl) bestEl.textContent = best == null ? '—' : (best / 1000).toFixed(3);
  }
  function press(at) {
    if (phase === 'arming') { clear(); phase = 'jump'; render(); return; }
    if (phase === 'go') {
      const ms = Math.max(1, Math.round(at - goAt));
      best = best == null ? ms : Math.min(best, ms);
      try { localStorage.setItem(KEY, String(best)); } catch (e) { /* private mode */ }
      phase = 'result';
      render(ms);
      return;
    }
    clear();
    phase = 'arming';
    render(0, 0);
    for (let i = 1; i <= 5; i++) timers.push(setTimeout(() => render(0, i), i * 700));
    timers.push(setTimeout(() => {
      phase = 'go';
      goAt = performance.now();
      render();
      requestAnimationFrame(() => { goAt = performance.now(); });   // time from the frame the lights go out
    }, 3500 + 400 + Math.random() * 2200));
  }
  game.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button === 0) press(e.timeStamp || performance.now()); });
  game.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(e.timeStamp || performance.now()); }
  });
  render();
})();

/* ── Cities: India in dots, Pune lit ───────────────────────────────
   The outline is India's official one (Natural Earth, India's point of
   view), in js/india.js. Dots fill it on a 12px grid at any size. */
(function cityMap() {
  const box = document.querySelector('[data-map]');
  if (!box) return;
  const cv = box.querySelector('.map-dots');
  const layer = box.querySelector('.map-cities');
  const shape = new Path2D(INDIA.path);
  const WEST = new Set(['Mumbai', 'Bengaluru', 'Ahmedabad', 'Kochi']);   // labels on the sea side
  const markers = CITIES.map(([name, x, y, first], k) => {
    const el = document.createElement('span');
    el.className = `map-city${first ? ' first' : ''}${WEST.has(name) ? ' west' : ''}`;
    el.style.setProperty('--k', String(k));
    el.innerHTML = `${first ? '<span class="ping"></span>' : ''}<span class="dot"></span><span class="name">${name.toUpperCase()}</span>`;
    layer.append(el);
    return { el, x, y };
  });

  let seen = false;
  function draw() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    const pad = 24;
    const s = Math.min((w - pad * 2) / INDIA.w, (h - pad * 2) / INDIA.h);
    const ox = (w - INDIA.w * s) / 2, oy = (h - INDIA.h * s) / 2;
    // Test grid points against the outline in device pixels…
    ctx.setTransform(s * dpr, 0, 0, s * dpr, ox * dpr, oy * dpr);
    const small = w < 520, g = small ? 9 : 12, rad = small ? 1.6 : 2, pts = [];
    for (let y = g / 2; y < h; y += g) {
      for (let x = g / 2; x < w; x += g) if (ctx.isPointInPath(shape, x * dpr, y * dpr, 'evenodd')) pts.push(x, y);
    }
    // …then paint them as plain dots.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const light = root.dataset.theme === 'light';
    ctx.fillStyle = light ? 'rgba(10,10,10,0.16)' : 'rgba(242,237,232,0.2)';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) { ctx.moveTo(pts[i] + rad, pts[i + 1]); ctx.arc(pts[i], pts[i + 1], rad, 0, Math.PI * 2); }
    ctx.fill();
    markers.forEach(({ el, x, y }) => { el.style.left = `${(ox + x * s).toFixed(1)}px`; el.style.top = `${(oy + y * s).toFixed(1)}px`; });
    box.classList.toggle('is-tight', w <= 420);
  }

  const start = () => { if (seen) return; seen = true; draw(); requestAnimationFrame(() => box.classList.add('is-drawn')); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: '200px 0px' });
    io.observe(box);
  } else start();
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (seen) draw(); }).observe(box);
  document.addEventListener('outdoor:theme', () => { if (seen) draw(); });
})();
