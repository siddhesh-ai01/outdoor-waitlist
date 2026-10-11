/* ==========================================================
   OUTDOOR — Mascot
   The app's five clips (outdoor-app/src/components/mascot), one SVG path
   per frame, played the way Mascot.tsx plays them: native fps, evenodd fill,
   frame 0 as the still pose under reduced motion.

   What each clip MEANS (docs/mascot.md) decides where it goes:
     run            setting off — the brand default
     cycle          going somewhere — a place not reached yet
     keepy-uppy     warming up — ready but not started
     tennis-bounce  idle, ball in hand
     f1-flag        the finish line — a thing that is done
   ========================================================== */

const NS = 'http://www.w3.org/2000/svg';
const BASE = new URL('../assets/mascot/', import.meta.url);

/* Hero rotation order (founder decision, 2026-10-10). */
export const CLIP_ORDER = ['run', 'cycle', 'keepy-uppy', 'tennis-bounce', 'f1-flag'];

const cache = new Map();
export function loadClip(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(new URL(`${name}.json`, BASE)).then((res) => {
      if (!res.ok) throw new Error(`mascot ${name}: ${res.status}`);
      return res.json();
    }));
  }
  return cache.get(name);
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const players = new Set();
let raf = 0;

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const e of entries) { const p = e.target._mascot; if (p) p.visible = e.isIntersecting; }
    kick();
  })
  : null;

function step(now) {
  raf = 0;
  if (document.hidden || reduceMotion.matches) return;
  let any = false;
  for (const p of players) {
    if (!p.visible || !p.playing) continue;
    any = true;
    // A rAF timestamp can predate the mount by a frame, so clamp before taking the modulo.
    const f = Math.floor((Math.max(0, now - p.t0) / 1000) * p.clip.fps) % p.clip.frames.length;
    if (f !== p.frame) { p.frame = f; p.path.setAttribute('d', p.clip.frames[f]); }
  }
  if (any) raf = requestAnimationFrame(step);
}
function kick() { if (!raf) raf = requestAnimationFrame(step); }
document.addEventListener('visibilitychange', kick);
reduceMotion.addEventListener?.('change', () => {
  for (const p of players) { p.frame = 0; p.path.setAttribute('d', p.clip.frames[0]); }
  kick();
});

/**
 * Draw a clip into an <svg>. `height` is BODY height in CSS px, so a seated
 * rider (cycle) renders shorter than a runner at the same value, as in the app.
 */
export async function mountMascot(svg, name, { height = 120, flip = false } = {}) {
  const clip = await loadClip(name);
  const s = height / (clip.bodyScale || clip.height);
  svg.setAttribute('viewBox', `0 0 ${clip.width} ${clip.height}`);
  svg.setAttribute('width', String(Math.round(clip.width * s)));
  svg.setAttribute('height', String(Math.round(clip.height * s)));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('mascot');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', clip.frames[0]);
  svg.replaceChildren(path);
  // A clip whose load widens the canvas to one side says where the body is.
  const shift = clip.bodyCenterX != null ? (clip.width / 2 - clip.bodyCenterX) * s : 0;
  svg.style.transform = `${shift ? `translateX(${shift.toFixed(1)}px) ` : ''}${flip ? 'scaleX(-1)' : ''}`.trim();

  const player = { svg, path, clip, frame: 0, t0: performance.now(), visible: true, playing: true };
  players.add(player);
  svg._mascot = player;
  io?.observe(svg);
  kick();
  return player;
}

/** Mount every <svg data-mascot="name" data-height="…" [data-flip]> on the page. */
export function mountAll(root = document) {
  return Promise.all(Array.from(root.querySelectorAll('svg[data-mascot]')).map((svg) =>
    mountMascot(svg, svg.dataset.mascot, {
      height: Number(svg.dataset.height) || 120,
      flip: svg.hasAttribute('data-flip'),
    }).catch(() => { svg.remove(); })));
}
