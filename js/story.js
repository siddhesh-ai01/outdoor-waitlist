/* ==========================================================
   OUTDOOR — Story
   The quote lights word by word · red cards flip as they come up (each
   card on its own on phones) · the long-game line fills toward "next" ·
   Ask the ref, one answer open at a time.
   ========================================================== */

import './site.js';
import { onFrame, reduceMotion, narrow, clamp01 } from './motion.js';

/* ── Half-time talk ────────────────────────────────────────────── */
const quote = document.querySelector('[data-quote]');
if (quote) {
  const words = quote.querySelectorAll('[data-w]');
  const n = words.length;
  onFrame((vh) => {
    if (reduceMotion.matches) { words.forEach((w) => { w.style.opacity = '1'; }); return; }
    const r = quote.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp01((vh * 0.8 - r.top) / (r.height * 0.7));
    words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp01(p * n * 1.1 - i)).toFixed(3); });
  });
}

/* ── Red cards ─────────────────────────────────────────────────── */
const cardsSec = document.querySelector('[data-cards]');
if (cardsSec) {
  const cards = cardsSec.querySelectorAll('[data-card]');
  onFrame((vh) => {
    const r = cardsSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp01((vh * 0.7 - r.top) / (vh * 0.75));
    cards.forEach((card, i) => {
      if (reduceMotion.matches) { card.style.transform = ''; return; }
      let k;
      if (narrow.matches) {                         // stacked: each card turns as it reaches the middle
        const rc = card.getBoundingClientRect();
        k = clamp01((vh * 0.78 - rc.top) / (vh * 0.45));
      } else k = clamp01(p * 1.7 - i * 0.32);
      card.style.transform = `rotateY(${(k * 180).toFixed(1)}deg)`;
    });
  });
}

/* ── The long game: the line fills to just past "now" ──────────── */
const track = document.querySelector('[data-phase-track]');
if (track) {
  const line = track.querySelector('[data-phase-line]');
  const fill = track.querySelector('[data-phase-fill]');
  const comet = track.querySelector('[data-phase-comet]');
  const nodes = track.querySelectorAll('[data-phase-node]');
  onFrame((vh) => {
    const r = track.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200 || nodes.length < 2) return;
    const lr = line.getBoundingClientRect();
    const p = reduceMotion.matches ? 1 : clamp01((vh * 0.9 - r.top) / (vh * 0.5));
    const vert = lr.height > lr.width, total = vert ? lr.height : lr.width;
    const pos = (el) => { const b = el.getBoundingClientRect(); return vert ? b.top + b.height / 2 - lr.top : b.left + b.width / 2 - lr.left; };
    const a = pos(nodes[0]), b = pos(nodes[1]);
    const len = Math.max(0, (a + 0.45 * (b - a)) * p);
    const rest = Math.max(0, total - len).toFixed(1);
    fill.style.clipPath = vert ? `inset(0 0 ${rest}px 0)` : `inset(0 ${rest}px 0 0)`;
    comet.style.transform = vert ? `translateY(${(a - 4).toFixed(1)}px)` : `translateX(${(a - 4).toFixed(1)}px)`;
    comet.style.setProperty('--odx', vert ? '0px' : `${(b - a).toFixed(1)}px`);
    comet.style.setProperty('--ody', vert ? `${(b - a).toFixed(1)}px` : '0px');
    comet.style.opacity = p > 0.96 && !reduceMotion.matches ? '1' : '0';
  });
}

/* ── Ask the ref ───────────────────────────────────────────────── */
const faq = document.querySelector('[data-faq]');
if (faq) {
  const items = Array.from(faq.querySelectorAll('.qa'));
  items.forEach((qa) => {
    qa.querySelector('.qa-q').addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      items.forEach((other) => {
        const on = other === qa && open;
        other.classList.toggle('is-open', on);
        other.querySelector('.qa-q').setAttribute('aria-expanded', String(on));
      });
    });
  });
}
