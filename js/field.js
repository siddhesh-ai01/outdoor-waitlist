/* ==========================================================
   OUTDOOR — The dot field
   Ported from outdoor-app/src/components/dotmatrix (spec.ts + ambientField.ts):
   the same 16px grid, seed, rotating blink slates, coloured embers and ragged
   fade at the bottom. On the site it is one canvas fixed to the screen; solid
   sections cover it and the see-through ones (heroes) let it show.

   Dots never move off-grid: only opacity changes (brand Part 10). The base
   grid is painted once; only the blinkers repaint, at ~30fps, and only while
   setActive(true) and the tab is visible. Still frame under reduced motion.
   ========================================================== */

const GRID = 16;
const ORANGE = '#FF4E00';
const SPORT_COLORS = ['#F7B300', '#06C27A', '#1EAEFF', '#FF3B3B', '#6C3FC4']; // cricket, football, tennis, f1, chess

/* spec.ts: AMBIENT, AMBIENT_TWINKLE, AMBIENT_ORANGE, blink classes */
const AMBIENT = {
  size: 3,
  dark: { color: '#F2EDE8', opacity: 0.16 },
  light: { color: '#0A0A0A', opacity: 0.105 },
  fadeStart: 0.62, fadeStartJitter: 0.06,
  columnEnd: { min: 0.66, max: 1.08 },
  steps: 10,
};
const TWINKLE = {
  size: 4, buckets: 4, freq: 0.0035, periodsMs: [2182, 2709, 3218, 2436],
  dark: { color: '#FFFFFF', max: 0.81 }, light: { color: '#0A0A0A', max: 0.54 },
};
const EMBER = { size: 4.5, buckets: 3, maxBuckets: 5, freq: 0.002, periodsMs: [3527, 4255, 4891, 3891, 4618], max: 0.9 };
const BLINK_CLASSES = [{ minAlpha: 0.85, amp: 1 }, { minAlpha: 0.45, amp: 0.55 }, { minAlpha: 0.05, amp: 0.26 }];
const SLATE_MIN = 2;
const SLATE_PLAN = [0, 0, 0, 1, 2];
const BRAND_SLOTS = 2;
const SEED = 20260808;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rgbCache = new Map();
function rgba(hex, a) {
  let c = rgbCache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    rgbCache.set(hex, c);
  }
  return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
}
function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) { const k = Math.floor(rand() * (i + 1)); [arr[i], arr[k]] = [arr[k], arr[i]]; }
  return arr;
}

/* ambientField.ts: buildAmbientField() */
function buildField(width, height, isDark, emberBuckets) {
  const rand = mulberry32(SEED);
  const cols = Math.ceil(width / GRID), rows = Math.ceil(height / GRID);
  const p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2;
  const { min, max } = AMBIENT.columnEnd;
  const fadeStart = [], fadeEnd = [];
  for (let c = 0; c < cols; c++) {
    const j = rand();
    const swell = 0.5 + 0.5 * (0.55 * Math.sin(c * 0.62 + p1) + 0.45 * Math.sin(c * 0.23 + p2));
    const mix = j > 0.94 ? 1 : 0.45 * swell + 0.55 * j;
    fadeEnd.push(height * (min + (max - min) * mix));
    fadeStart.push(height * (AMBIENT.fadeStart + AMBIENT.fadeStartJitter * (j - 0.5)));
  }
  const steps = AMBIENT.steps;
  const base = Array.from({ length: steps }, () => []);
  const pools = BLINK_CLASSES.map(() => []);
  for (let c = 0; c < cols; c++) {
    const start = fadeStart[c], end = fadeEnd[c];
    for (let r = 0; r < rows; r++) {
      const y = r * GRID + GRID / 2;
      if (y >= end) continue;
      let a = 1;
      if (y > start) a = Math.pow(1 - (y - start) / (end - start), 1.6);
      if (a <= 0.02) continue;
      const dot = { x: c * GRID + GRID / 2, y };
      base[Math.min(steps - 1, Math.max(0, Math.round(a * steps) - 1))].push(dot);
      const cls = BLINK_CLASSES.findIndex((k) => a >= k.minAlpha);
      if (cls >= 0) pools[cls].push(dot);
    }
  }
  const theme = isDark ? AMBIENT.dark : AMBIENT.light;
  const layers = [];
  for (let i = 0; i < steps; i++) {
    if (base[i].length) layers.push({ points: base[i], color: rgba(theme.color, ((i + 1) / steps) * theme.opacity) });
  }
  const cursors = pools.map(() => 0);
  pools.forEach((p) => shuffle(p, rand));
  const deal = (cls, n) => {
    const p = pools[cls], out = [];
    for (let i = 0; i < n && p.length > 0; i++) out.push(p[cursors[cls]++ % p.length]);
    return out;
  };
  const hasPool = pools.some((p) => p.length > 0);
  const plan = (cfg) => Array.from({ length: cfg.buckets }, (_, b) => {
    const order = shuffle([...SLATE_PLAN], rand);
    const slates = [], amps = [];
    for (const cls of order) {
      const dealt = deal(cls, Math.max(SLATE_MIN, Math.round(pools[cls].length * cfg.freq)));
      if (!dealt.length) continue;
      slates.push(dealt); amps.push(BLINK_CLASSES[cls].amp);
    }
    return { slates, amps, periodMs: cfg.periodsMs[b % cfg.periodsMs.length], phase: (b + rand() * 0.4) / cfg.buckets };
  }).filter((b) => b.slates.length > 0);
  return { layers, twinkle: hasPool ? plan(TWINKLE) : [], embers: hasPool ? plan({ ...EMBER, buckets: emberBuckets }) : [] };
}

/* spec.ts: emberBucketPlans(). Bucket 0 is pinned to brand orange; the rest
   carry orange plus a share of the sport colours. */
function dealShares(colours, n) {
  const share = Array.from({ length: n }, () => []);
  if (!colours.length) return share;
  for (let k = 0; k < Math.max(n, colours.length); k++) {
    const bucket = share[k % n], colour = colours[k % colours.length];
    if (!bucket.includes(colour)) bucket.push(colour);
  }
  return share;
}
function emberPlans(palette, buckets, rand) {
  const out = [{ colors: [ORANGE], plan: [0] }];
  const rotating = Math.max(0, buckets - 1);
  const share = dealShares(palette.slice(1), rotating);
  for (let b = 0; b < rotating; b++) {
    const colors = [ORANGE, ...share[b]];
    const p = [];
    for (let i = 0; i < BRAND_SLOTS; i++) p.push(0);
    for (let i = 1; i < colors.length; i++) p.push(i);
    out.push({ colors, plan: shuffle(p, rand) });
  }
  return out;
}
const emberBucketCount = (n) => Math.min(EMBER.maxBuckets, EMBER.buckets + Math.max(0, n - 2));

/**
 * Paint the field into `root` (a fixed, full-screen host).
 * @param {HTMLElement} root
 * @param {{ embers?: 'all'|'brand' }} opts
 * @returns {{ setActive(on: boolean): void }}
 */
export function initField(root, opts = {}) {
  const { embers = 'all' } = opts;
  const canvas = document.createElement('canvas');
  canvas.className = 'field-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  root.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = embers === 'all' ? [ORANGE, ...SPORT_COLORS] : [ORANGE];
  const buckets = emberBucketCount(palette.length);

  let W = 0, H = 0, DPR = 1, isDark = true;
  let field = null, base = null, plans = [];
  let active = true, raf = 0, lastFrame = 0, buildQueued = false;
  const t0 = performance.now();

  function build() {
    buildQueued = false;
    const rect = root.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);
    isDark = document.documentElement.dataset.theme !== 'light';
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    field = buildField(W, H, isDark, buckets);
    plans = emberPlans(palette, buckets, mulberry32(SEED + 1));
    base = document.createElement('canvas');
    base.width = canvas.width; base.height = canvas.height;
    const bx = base.getContext('2d');
    bx.scale(DPR, DPR);
    const r = AMBIENT.size / 2;
    for (const layer of field.layers) {
      bx.fillStyle = layer.color;
      bx.beginPath();
      for (const p of layer.points) { bx.moveTo(p.x + r, p.y); bx.arc(p.x, p.y, r, 0, Math.PI * 2); }
      bx.fill();
    }
    draw();
  }
  function queueBuild() {
    if (buildQueued) return;
    buildQueued = true;
    requestAnimationFrame(build);
  }

  function blink(b, t, color, max, size) {
    const p = t / b.periodMs + b.phase, i = Math.floor(p);
    const op = max * b.amps[i % b.amps.length] * (0.5 - 0.5 * Math.cos((p - i) * Math.PI * 2));
    if (op < 0.004) return;
    const r = size / 2;
    ctx.fillStyle = rgba(color, op);
    ctx.beginPath();
    for (const d of b.slates[i % b.slates.length]) { ctx.moveTo(d.x + r, d.y); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); }
    ctx.fill();
  }

  function draw() {
    if (!field) return;
    const t = performance.now() - t0;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0, W, H);
    if (reduceMotion.matches) return;
    const tw = isDark ? TWINKLE.dark : TWINKLE.light;
    for (const b of field.twinkle) blink(b, t, tw.color, tw.max, TWINKLE.size);
    field.embers.forEach((b, bi) => {
      const plan = plans[bi % plans.length];
      const i = Math.floor(t / b.periodMs + b.phase);
      // The colour is picked by the cycle index, so it only changes at the trough.
      blink(b, t, plan.colors[plan.plan[i % plan.plan.length]], EMBER.max, EMBER.size);
    });
  }

  function loop(now) {
    raf = 0;
    if (!active || document.hidden || reduceMotion.matches) return;
    if (now - lastFrame >= 32) { lastFrame = now; draw(); }
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && active && !document.hidden && !reduceMotion.matches) raf = requestAnimationFrame(loop); }

  document.addEventListener('visibilitychange', kick);
  reduceMotion.addEventListener?.('change', () => { draw(); kick(); });
  document.addEventListener('outdoor:theme', queueBuild);
  if ('ResizeObserver' in window) {
    let lw = 0, lh = 0;
    new ResizeObserver(() => {
      const r = root.getBoundingClientRect();
      if (Math.round(r.width) !== lw || Math.round(r.height) !== lh) { lw = Math.round(r.width); lh = Math.round(r.height); queueBuild(); }
    }).observe(root);
  } else window.addEventListener('resize', queueBuild);

  build();
  kick();
  return {
    setActive(on) { active = on; if (on) kick(); },
  };
}
