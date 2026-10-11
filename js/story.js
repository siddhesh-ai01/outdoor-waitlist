/* ==========================================================
   OUTDOOR — Story
   Quiet field behind the opener (brand orange embers only), and the
   "five apps fold into one" piece, driven by scroll.
   ========================================================== */

import './site.js';
import { initField } from './field.js';

const opener = document.querySelector('.story-hero');
if (opener) initField(opener, { embers: 'brand' });

(function fold() {
  const section = document.querySelector('[data-fold]');
  if (!section) return;
  const tiles = Array.from(section.querySelectorAll('[data-fold-tile]'));
  const icon = section.querySelector('[data-fold-icon]');
  const caption = section.querySelector('[data-fold-caption]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const render = () => {
    raf = 0;
    if (reduce.matches) { section.classList.add('is-folded'); return; }
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const travel = Math.max(1, r.height - vh);
    const p = Math.max(0, Math.min(1, -r.top / travel));
    const e = ease(Math.min(1, p / 0.85));
    const n = tiles.length;
    const tileW = tiles[0].offsetWidth;
    const room = (icon.parentElement?.clientWidth || r.width) - tileW;
    const spacing = Math.min(tileW * 1.35, room / Math.max(1, n - 1));
    tiles.forEach((tile, i) => {
      const offset = (i - (n - 1) / 2) * spacing;
      tile.style.transform = `translateX(${(offset * (1 - e)).toFixed(1)}px) scale(${(1 - 0.55 * e).toFixed(3)})`;
      tile.style.opacity = String(Math.max(0, 1 - e * 1.35));
    });
    const s = 0.55 + 0.45 * ease(Math.max(0, (p - 0.35) / 0.55));
    icon.style.transform = `scale(${s.toFixed(3)})`;
    icon.style.opacity = String(Math.max(0, Math.min(1, (p - 0.3) / 0.35)));
    caption?.setAttribute('data-stage', p > 0.62 ? 'after' : 'before');
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(render); };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  reduce.addEventListener?.('change', queue);
  render();
})();
