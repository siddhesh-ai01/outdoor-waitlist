/* ==========================================================
   OUTDOOR — The dot field
   Ported from outdoor-app/src/components/dotmatrix (spec.ts + ambientField.ts),
   so the site opens on the app's own canvas: the same 16px grid, seed, rotating
   blink slates, coloured embers and ragged fade at the bottom.

   On the home hero the five mascot clips are lit IN PLACE on that grid as an
   orange LED silhouette, one after another (founder decision 2026-10-10).
   Dots never move off-grid: everything is opacity and size (brand Part 10).

   Behaviour: sharp at device pixel ratio · the base grid is painted once ·
   paused off-screen and in background tabs · still frame under reduced motion ·
   dots near the pointer brighten · the silhouette dissolves as the hero scrolls away.
   ========================================================== */

import { loadClip, CLIP_ORDER } from './mascot.js';

const GRID = 16;
const ORANGE = '#FF4E00';
const SPORT_COLORS = ['#F7B300', '#06C27A', '#1EAEFF', '#FF3B3B', '#6C3FC4']; // cricket, football, tennis, f1, chess

/* spec.ts — AMBIENT, AMBIENT_TWINKLE, AMBIENT_ORANGE, blink classes */
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

/* Silhouette */
const CLIP_MS = 6000;      // each clip holds the stage this long
const WIPE_MS = 760;       // scan-line handover between clips
const BODY_REF = 519;      // every clip's standing-body height in its own units
/* Union of all five clip canvases around the body centre, in clip units:
   cycle reaches 268.5 left of the body, the f1 flag 397 to the right. */
const UNION_LEFT = 268.5;
const UNION_WIDTH = 268.5 + 397;

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

/* ambientField.ts — buildAmbientField() */
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

/* spec.ts — emberBucketPlans(): bucket 0 is pinned to brand orange, the rest
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

/* Coverage of a shape per grid cell, supersampled, weighted toward a dense
   core and a softer edge (brand Part 10.6). */
export function rasterize(cols, rows, draw, SS = 5, depthR = 2) {
  const w = cols * SS, h = rows * SS;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d', { willReadFrequently: true });
  c2.fillStyle = '#000';
  draw(c2, w, h);
  const data = c2.getImageData(0, 0, w, h).data;
  const cov = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let s = 0;
    for (let y = 0; y < SS; y++) {
      let i = ((r * SS + y) * w + c * SS) * 4 + 3;
      for (let x = 0; x < SS; x++, i += 4) s += data[i];
    }
    cov[r * cols + c] = s / (SS * SS * 255);
  }
  // A tight window (depthR 1) keeps thin limbs bright; a wide one (2) gives broad shapes a dense core.
  const span = (depthR * 2 + 1) ** 2;
  const out = new Float32Array(cov.length);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = r * cols + c, v = cov[k];
    if (v < 0.05) continue;
    let s = 0;
    for (let dy = -depthR; dy <= depthR; dy++) for (let dx = -depthR; dx <= depthR; dx++) {
      const rr = r + dy, cc = c + dx;
      if (rr >= 0 && cc >= 0 && rr < rows && cc < cols) s += cov[rr * cols + cc];
    }
    out[k] = Math.min(1, v * (0.45 + 0.65 * (s / span)));
  }
  return out;
}

const idle = window.requestIdleCallback
  ? (fn) => window.requestIdleCallback(fn, { timeout: 600 })
  : (fn) => setTimeout(fn, 60);

/**
 * Paint the field behind `root`.
 * @param {HTMLElement} root  the section (gets the canvas as its first child)
 * @param {{ silhouette?: 'mascot', embers?: 'all'|'brand', pointer?: boolean }} opts
 */
export function initField(root, opts = {}) {
  const { silhouette = null, embers = 'all', pointer = true } = opts;
  const canvas = document.createElement('canvas');
  canvas.className = 'field-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  root.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let glow = null;
  if (silhouette) {
    glow = document.createElement('div');
    glow.className = 'field-glow';
    glow.setAttribute('aria-hidden', 'true');
    root.prepend(glow);
  }
  const stageEl = silhouette ? root.querySelector('[data-field-stage]') : null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = embers === 'all' ? [ORANGE, ...SPORT_COLORS] : [ORANGE];
  const buckets = emberBucketCount(palette.length);

  let W = 0, H = 0, DPR = 1, isDark = true;
  let field = null, base = null, plans = [], sil = null, ptr = null;
  let visible = false, raf = 0, lastFrame = 0, lastT = 0, buildQueued = false;
  const t0 = performance.now();
  const clock = () => performance.now() - t0;
  const clips = new Array(CLIP_ORDER.length).fill(null);

  /* ── silhouette geometry: the union of every clip, bottom-aligned on one baseline ── */
  function layoutSilhouette() {
    sil = null;
    if (!stageEl || !silhouette) return;
    const rr = root.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
    const sx = sr.left - rr.left, sy = sr.top - rr.top, sw = sr.width, sh = sr.height;
    if (sw < GRID * 6 || sh < GRID * 6) return;
    // The flag and the bike reach past the runner, so the union may run on past the
    // stage towards the hero's right edge rather than shrinking the figure to fit.
    const right = rr.width - GRID;
    const availW = Math.max(sw, right - sx);
    let rows = Math.floor(sh / GRID);
    let cols = Math.ceil((UNION_WIDTH * rows) / BODY_REF);
    if (cols * GRID > availW) {
      rows = Math.floor(((availW / GRID) * BODY_REF) / UNION_WIDTH);
      cols = Math.ceil((UNION_WIDTH * rows) / BODY_REF);
    }
    if (rows < 8) return;
    // Centre the BODY on the stage, then keep the whole union inside the hero.
    const bodyCol = (sx + sw / 2) / GRID;
    let c0 = Math.round(bodyCol - cols * (UNION_LEFT / UNION_WIDTH));
    c0 = Math.max(Math.ceil(sx / GRID) - 1, Math.min(c0, Math.floor(right / GRID) - cols));
    const r0 = Math.round((sy + sh) / GRID) - rows;
    const n = cols * rows, rnd = mulberry32(7);
    sil = {
      cols, rows, c0, r0, n,
      D: new Float32Array(n), T: new Float32Array(n),
      delay: new Float32Array(n), thr: new Float32Array(n),
      maps: new Array(CLIP_ORDER.length).fill(null), pending: new Set(),
      clip: 0, clipStart: 0, prev: -1, prevStart: 0, swapAt: -1e9,
    };
    for (let k = 0; k < n; k++) {
      const c = k % cols, r = (k / cols) | 0;
      sil.thr[k] = rnd();
      sil.delay[k] = ((c / cols) * 0.8 + (r / rows) * 0.2) * (WIPE_MS - 180) + rnd() * 180;
    }
    if (glow) {
      const gx = (c0 + cols * (UNION_LEFT / UNION_WIDTH)) * GRID;
      const gy = (r0 + rows / 2) * GRID, gs = Math.max(cols, rows) * GRID * 1.5;
      Object.assign(glow.style, { left: `${gx - gs / 2}px`, top: `${gy - gs / 2}px`, width: `${gs}px`, height: `${gs}px` });
    }
  }

  function rasterizeClip(i) {
    const clip = clips[i];
    if (!sil || !clip || sil.maps[i]) return;
    const { cols, rows } = sil;
    const scaleCells = rows / BODY_REF;                       // cells per clip unit
    const offX = UNION_LEFT - (clip.bodyCenterX ?? clip.width / 2);
    const offY = BODY_REF - clip.height;                       // feet on the shared baseline
    sil.maps[i] = clip.frames.map((d) => {
      const path = new Path2D(d);
      return rasterize(cols, rows, (c2, w) => {
        const k = (w / cols) * scaleCells;                     // px per clip unit at supersample
        c2.setTransform(k, 0, 0, k, offX * k, offY * k);
        c2.fill(path, 'evenodd');
      }, 5, 1);
    });
  }
  function ensureClip(i) {
    if (!sil || sil.maps[i] || sil.pending.has(i)) return;
    sil.pending.add(i);
    loadClip(CLIP_ORDER[i]).then((clip) => {
      clips[i] = clip;
      idle(() => { if (sil) { rasterizeClip(i); sil.pending.delete(i); kick(); } });
    }).catch(() => sil && sil.pending.delete(i));
  }

  /* ── build: canvas size, field, base layer ── */
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
    const keep = sil ? { clip: sil.clip, clipStart: sil.clipStart } : null;
    layoutSilhouette();
    if (sil) {
      if (keep) { sil.clip = keep.clip; sil.clipStart = keep.clipStart; }
      else sil.clipStart = clock();
      CLIP_ORDER.forEach((_, i) => { if (clips[i]) rasterizeClip(i); });
      ensureClip(sil.clip);
      ensureClip((sil.clip + 1) % CLIP_ORDER.length);
      if (reduceMotion.matches) settleStill();
    }
    draw(true);
  }
  function queueBuild() {
    if (buildQueued) return;
    buildQueued = true;
    requestAnimationFrame(build);
  }

  function settleStill() {
    if (!sil || !sil.maps[0]) return;
    sil.clip = 0;
    sil.D.set(sil.maps[0][0]);
  }

  /* ── per frame ── */
  function updateSilhouette(t, dt) {
    const s = sil;
    if (!s.maps[s.clip]) return;
    if (t - s.clipStart >= CLIP_MS) {
      const next = (s.clip + 1) % CLIP_ORDER.length;
      if (s.maps[next]) {
        s.prev = s.clip; s.prevStart = s.clipStart;
        s.clip = next; s.clipStart = t; s.swapAt = t;
        ensureClip((next + 1) % CLIP_ORDER.length);
      } else ensureClip(next);
    }
    const frameOf = (i, start) => {
      const maps = s.maps[i], fps = clips[i].fps;
      return maps[Math.floor(((t - start) / 1000) * fps) % maps.length];
    };
    const cur = frameOf(s.clip, s.clipStart);
    const since = t - s.swapAt;
    const prev = since < WIPE_MS && s.prev >= 0 && s.maps[s.prev] ? frameOf(s.prev, s.prevStart) : null;
    const k1 = Math.min(1, dt / 45);
    for (let k = 0; k < s.n; k++) {
      const target = prev && since < s.delay[k] ? prev[k] : cur[k];
      s.D[k] += (target - s.D[k]) * k1;
    }
  }

  function drawSilhouette(dissolve) {
    const { cols, c0, r0, D, thr } = sil;
    const groups = new Map();
    for (let k = 0; k < D.length; k++) {
      let d = D[k];
      if (d < 0.05) continue;
      if (dissolve > 0) {
        const m = (thr[k] - dissolve) / 0.08;
        if (m <= 0) continue;
        if (m < 1) d *= m;
        if (d < 0.05) continue;
      }
      const rad = d >= 0.72 ? 4 : d >= 0.45 ? 3 : d >= 0.2 ? 2 : 1;  // 8 / 6 / 4 / 2 px dots
      let a = 0.5 + 0.35 * Math.min(1, d);                             // 50–85% orange
      if (d < 0.2) a *= d / 0.2;
      const key = rad * 100 + Math.round(a * 20);
      let list = groups.get(key);
      if (!list) groups.set(key, (list = []));
      list.push(k);
    }
    for (const [key, list] of groups) {
      const rad = Math.floor(key / 100);
      ctx.fillStyle = rgba(ORANGE, (key % 100) / 20);
      ctx.beginPath();
      for (const k of list) {
        const x = (c0 + (k % cols)) * GRID + GRID / 2;
        const y = (r0 + ((k / cols) | 0)) * GRID + GRID / 2;
        ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, Math.PI * 2);
      }
      ctx.fill();
    }
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
  function drawBlinks(t) {
    const tw = isDark ? TWINKLE.dark : TWINKLE.light;
    for (const b of field.twinkle) blink(b, t, tw.color, tw.max, TWINKLE.size);
    field.embers.forEach((b, bi) => {
      const plan = plans[bi % plans.length];
      const i = Math.floor(t / b.periodMs + b.phase);
      // The colour is picked by the cycle index, so it only changes at the trough.
      blink(b, t, plan.colors[plan.plan[i % plan.plan.length]], EMBER.max, EMBER.size);
    });
  }

  function drawPointer(dt) {
    if (!ptr) return;
    ptr.a += ((ptr.in ? 1 : 0) - ptr.a) * (reduceMotion.matches ? 1 : Math.min(1, dt / 140));
    if (!ptr.in && ptr.a < 0.01) { ptr = null; return; }
    const R = 6 * GRID, peak = (isDark ? 0.42 : 0.3) * ptr.a;
    const color = isDark ? AMBIENT.dark.color : AMBIENT.light.color;
    const groups = [[], [], [], []];
    for (let r = Math.max(0, Math.floor((ptr.y - R) / GRID)); r <= Math.ceil((ptr.y + R) / GRID); r++) {
      for (let c = Math.max(0, Math.floor((ptr.x - R) / GRID)); c <= Math.ceil((ptr.x + R) / GRID); c++) {
        const x = c * GRID + GRID / 2, y = r * GRID + GRID / 2;
        const d = Math.hypot(x - ptr.x, y - ptr.y);
        if (d >= R) continue;
        const f = 1 - d / R;
        groups[Math.min(3, Math.floor(f * f * 4))].push(x, y);
      }
    }
    groups.forEach((list, g) => {
      if (!list.length) return;
      const rad = 1.5 + g * 0.35;
      ctx.fillStyle = rgba(color, (peak * (g + 1)) / 4);
      ctx.beginPath();
      for (let i = 0; i < list.length; i += 2) { ctx.moveTo(list[i] + rad, list[i + 1]); ctx.arc(list[i], list[i + 1], rad, 0, Math.PI * 2); }
      ctx.fill();
    });
  }

  function draw(force) {
    if (!field) return;
    const t = clock();
    const dt = lastT ? Math.min(64, Math.max(0, t - lastT)) : 16;
    lastT = t;
    const still = reduceMotion.matches;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0, W, H);
    if (!still) drawBlinks(t);
    let dissolve = 0;
    if (sil) {
      // Starts once half the hero has scrolled away, finishes by the time it has gone.
      const rect = root.getBoundingClientRect();
      dissolve = Math.max(0, Math.min(1, (-rect.top - rect.height * 0.5) / (rect.height * 0.4)));
      if (!still) updateSilhouette(t, dt);
      else if (sil.maps[0] && sil.D.every((v) => v === 0)) settleStill();
      drawSilhouette(dissolve);
    }
    if (glow) glow.style.opacity = sil && sil.maps[sil.clip] ? String(1 - dissolve) : '0';
    if (pointer) drawPointer(dt);
    return force;
  }

  function loop(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    // ~30 fps is plenty for a 24 fps clip and a slow blink, and halves the work on phones.
    if (now - lastFrame >= 32) { lastFrame = now; draw(); }
    if (!reduceMotion.matches || (ptr && (ptr.in || ptr.a > 0.01))) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(loop); }

  /* ── wiring ── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) kick();
    }).observe(root);
  } else visible = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  reduceMotion.addEventListener?.('change', () => { if (reduceMotion.matches) settleStill(); draw(); kick(); });
  document.addEventListener('outdoor:theme', queueBuild);
  if ('ResizeObserver' in window) {
    let lw = 0, lh = 0;
    new ResizeObserver(() => {
      const r = root.getBoundingClientRect();
      if (Math.round(r.width) !== lw || Math.round(r.height) !== lh) { lw = Math.round(r.width); lh = Math.round(r.height); queueBuild(); }
    }).observe(root);
  } else window.addEventListener('resize', queueBuild);
  window.addEventListener('scroll', () => { if (reduceMotion.matches && visible) draw(); }, { passive: true });

  if (pointer) {
    const track = (e) => {
      if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.buttons) return;
      const r = root.getBoundingClientRect();
      ptr = ptr || { a: 0 };
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true;
      if (reduceMotion.matches) draw(); else kick();
    };
    const release = (e) => {
      if (ptr && (e.type === 'pointerleave' || e.pointerType !== 'mouse')) ptr.in = false;
      if (reduceMotion.matches) draw(); else kick();
    };
    root.addEventListener('pointermove', track, { passive: true });
    root.addEventListener('pointerdown', track, { passive: true });
    root.addEventListener('pointerleave', release);
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
  }

  build();
  if (silhouette) {
    // First clip as soon as it lands; the rest load and rasterise in idle time.
    loadClip(CLIP_ORDER[0]).then((clip) => {
      clips[0] = clip;
      if (sil) { rasterizeClip(0); if (reduceMotion.matches) settleStill(); }
      draw(); kick();
    }).catch(() => {});
  }
  kick();
}
