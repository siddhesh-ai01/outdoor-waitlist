/* ==========================================================
   OUTDOOR — Motion kit
   One frame loop for every scroll-linked effect, staggered reveals
   ([data-rv]), count-up numbers, magnetic buttons ([data-mag]), 3D tilt
   ([data-tilt]) and the cursor ring. Pointer effects run only on a fine
   pointer, and nothing here moves under reduced motion.
   ========================================================== */

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
export const narrow = window.matchMedia('(max-width: 859.98px)');
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const fmt = (n) => Number(n).toLocaleString('en-IN');

const root = document.documentElement;

/* ── One frame per scroll or resize, shared by every effect ────── */
const frameFns = new Set();
let raf = 0;
function runFrame() {
  raf = 0;
  const vh = window.innerHeight, vw = window.innerWidth;
  for (const fn of frameFns) fn(vh, vw);
}
export function requestFrame() { if (!raf) raf = requestAnimationFrame(runFrame); }
export function onFrame(fn) { frameFns.add(fn); requestFrame(); return () => frameFns.delete(fn); }
window.addEventListener('scroll', requestFrame, { passive: true });
window.addEventListener('resize', requestFrame);
if ('ResizeObserver' in window) new ResizeObserver(requestFrame).observe(document.body || root);
document.fonts?.ready.then(requestFrame);

/* ── Reveals ───────────────────────────────────────────────────────
   Elements fade and rise in, 80ms apart (data-rv="n"), once they are
   within 92% of the viewport. Held while the intro or a page cover is up. */
let hold = 0;
const pending = new Set();
export function holdReveals(on) {
  hold = Math.max(0, hold + (on ? 1 : -1));
  if (!hold) requestFrame();
}
function show(el) {
  el.classList.add('is-in');
  el.dispatchEvent(new CustomEvent('reveal'));
}
export function scanReveals(scope = document) {
  scope.querySelectorAll('[data-rv]').forEach((el) => {
    if (el._rv) return;
    el._rv = true;
    if (reduceMotion.matches) show(el);
    else pending.add(el);
  });
  requestFrame();
}
onFrame((vh) => {
  if (hold || !pending.size) return;
  for (const el of pending) {
    if (!el.isConnected) { pending.delete(el); continue; }
    const r = el.getBoundingClientRect();
    if ((r.width || r.height) && r.top < vh * 0.92 && r.bottom > -40) { show(el); pending.delete(el); }
  }
});
/** Run fn once el has revealed (now, if it already has). */
export function whenRevealed(el, fn) {
  if (!el.hasAttribute('data-rv') || el.classList.contains('is-in')) fn();
  else el.addEventListener('reveal', fn, { once: true });
}
root.classList.add('rv-ready');

/* ── Count-up ──────────────────────────────────────────────────── */
export function countUp(el, to, duration = 1600) {
  if (reduceMotion.matches) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / duration), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(to * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── Pointer effects: magnetic buttons, tilt, cursor ring ─────── */
let mags = [], tilts = [];
let px = null, py = null, pointerQueued = false;
export function refreshPointerTargets() {
  mags = Array.from(document.querySelectorAll('[data-mag]'));
  tilts = Array.from(document.querySelectorAll('[data-tilt]'));
}
const pointerOn = () => finePointer.matches && !reduceMotion.matches;

function applyPointer() {
  pointerQueued = false;
  if (px == null) return;
  for (const el of mags) {
    if (!el.isConnected) continue;
    const r = el.getBoundingClientRect();
    const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
    const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
    el.style.transition = 'transform 300ms cubic-bezier(0.33,1,0.68,1)';
    el.style.transform = near ? `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)` : '';
  }
  for (const el of tilts) {
    const inner = el.querySelector('[data-tilt-inner]');
    if (!inner || !el.isConnected) continue;
    const r = el.getBoundingClientRect();
    const nx = (px - r.left) / r.width - 0.5, ny = (py - r.top) / r.height - 0.5;
    if (Math.abs(nx) < 0.7 && Math.abs(ny) < 0.7) {
      inner.style.transform = `rotateX(${(-ny * 14).toFixed(2)}deg) rotateY(${(nx * 18).toFixed(2)}deg)`;
      inner.style.setProperty('--mx', `${((nx + 0.5) * 100).toFixed(1)}%`);
      inner.style.setProperty('--my', `${((ny + 0.5) * 100).toFixed(1)}%`);
    } else inner.style.transform = '';
  }
}

/* The ring trails the pointer, grows over anything clickable and shows the
   target's data-cur label (JOIN, READ, PLAY…) in a filled capsule. */
let ring = null, ringLabel = null, rx = -100, ry = -100, ringRaf = 0, ringKey = '';
function ringStep() {
  ringRaf = 0;
  if (!ring || px == null) return;
  rx += (px - rx) * 0.22; ry += (py - ry) * 0.22;
  ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
  if (Math.abs(px - rx) > 0.2 || Math.abs(py - ry) > 0.2) ringRaf = requestAnimationFrame(ringStep);
}
function ringHover(target) {
  const t = target && target.closest ? target.closest('[data-cur], a, button, [role="button"], label, summary') : null;
  const label = t ? t.getAttribute('data-cur') || '' : '';
  const key = (t ? (label ? 'L' : 'H') : 'N') + label;
  if (key === ringKey) return;
  ringKey = key;
  ring.classList.toggle('is-hover', !!t && !label);
  ring.classList.toggle('is-label', !!label);
  if (label) ringLabel.textContent = label;
}
function setupRing() {
  const on = pointerOn();
  root.classList.toggle('has-cursor', on);
  if (!on || ring) return;
  ring = document.createElement('div');
  ring.className = 'cursor is-out';                 // hidden until the pointer first moves
  ring.setAttribute('aria-hidden', 'true');
  ringLabel = document.createElement('span');
  ringLabel.className = 'cursor-label';
  ring.append(ringLabel);
  document.body.append(ring);
}

export function initPointerFx() {
  refreshPointerTargets();
  setupRing();
  finePointer.addEventListener?.('change', setupRing);
  reduceMotion.addEventListener?.('change', setupRing);
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !pointerOn()) return;
    px = e.clientX; py = e.clientY;
    if (!pointerQueued) { pointerQueued = true; requestAnimationFrame(applyPointer); }
    if (ring) {
      ring.classList.remove('is-out');
      ringHover(e.target);
      if (!ringRaf) ringRaf = requestAnimationFrame(ringStep);
    }
  }, { passive: true });
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget && ring) ring.classList.add('is-out'); });
  // Labels change under a still pointer too (the theme button, the pass page swapping state).
  document.addEventListener('outdoor:theme', () => { ringKey = ''; });
}
