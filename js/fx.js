/* ==========================================================
   OUTDOOR — Canvas effects (from the v2 prototype's outdoor-fx.js)
   led()      the stadium board: messages scroll across a dot grid in
              orange LEDs; dots near the pointer heat up
   squad()    scattered people gather into games as p goes 0 → 1
   confetti() a burst of dots and slips in the brand and sport colours
   Every loop sleeps off-screen and in background tabs.
   ========================================================== */

const ORANGE = '#FF4E00';
const isLight = () => document.documentElement.dataset.theme === 'light';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrow = window.matchMedia('(max-width: 859.98px)');

function fit(cv) {
  const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * d));
  cv.height = Math.max(1, Math.round(r.height * d));
  const ctx = cv.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

/* A frame loop that only runs while visible; fn(dt, now). Phones get ~30fps. */
function loop(fn) {
  let raf = 0, dead = false, vis = true, last = 0;
  const tick = (now) => {
    raf = 0;
    if (dead || !vis || document.hidden) return;
    const gap = narrow.matches ? 31 : 0;
    if (!last) last = now;
    if (now - last >= gap) { fn(Math.min(64, now - last || 16), now); last = now; }
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && !dead && vis && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
  document.addEventListener('visibilitychange', kick);
  kick();
  return {
    stop() { dead = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', kick); },
    set visible(v) { vis = v; if (v) kick(); },
    kick,
  };
}
function watch(el, L) {
  if (!('IntersectionObserver' in window)) return null;
  const io = new IntersectionObserver((es) => { L.visible = es[es.length - 1].isIntersecting; });
  io.observe(el);
  return io;
}

/* ── LED stadium board ─────────────────────────────────────────── */
export function led(cv, opts = {}) {
  const messages = opts.messages || ["Let's get out humans"];
  const cellFor = typeof opts.cell === 'function' ? opts.cell : () => opts.cell || 14;
  let g, cell, cols, rows, strip = [], stripLen = 1, off = 0, ptr = null, ptrA = 0, built = false;

  function build() {
    g = fit(cv);
    cell = cellFor();
    cols = Math.ceil(g.w / cell) + 1;
    rows = Math.max(7, Math.floor(g.h / cell));
    const textRows = rows - 2;
    const fs = Math.round(textRows / 0.7);
    const oc = document.createElement('canvas'), ox = oc.getContext('2d', { willReadFrequently: true });
    ox.font = `${fs}px "Bebas Neue", Impact, sans-serif`;
    const text = messages.map((m) => m.toUpperCase()).join('   •   ') + '   •   ';
    const tw = Math.ceil(ox.measureText(text).width) + 2;
    oc.width = tw; oc.height = rows;
    ox.font = `${fs}px "Bebas Neue", Impact, sans-serif`;
    ox.textBaseline = 'alphabetic';
    ox.fillStyle = '#000';
    ox.fillText(text, 0, 1 + textRows);
    const data = ox.getImageData(0, 0, tw, rows).data;
    strip = [];
    for (let c = 0; c < tw; c++) {
      const col = new Uint8Array(rows);
      for (let r = 0; r < rows; r++) col[r] = data[(r * tw + c) * 4 + 3] > 120 ? 1 : 0;
      strip.push(col);
    }
    stripLen = strip.length;
    built = true;
    draw(16);
  }

  function draw(dt) {
    if (!built) return;
    const { ctx, w, h } = g;
    if (!reduce.matches) off += dt * 0.018;
    ptrA += ((ptr ? 1 : 0) - ptrA) * Math.min(1, dt / 120);
    ctx.clearRect(0, 0, w, h);
    const y0 = (h - rows * cell) / 2;
    const base = Math.floor(off), frac = off - base;
    const light = isLight();
    const lit = new Path2D(), dim = new Path2D(), hot = [];
    for (let c = 0; c < cols; c++) {
      const sc = strip[(base + c) % stripLen];
      const x = (c - frac) * cell + cell / 2;
      for (let r = 0; r < rows; r++) {
        const y = y0 + r * cell + cell / 2;
        let boost = 0;
        if (ptr && ptrA > 0.01) {
          const d = Math.hypot(x - ptr.x, y - ptr.y);
          if (d < cell * 6) boost = (1 - d / (cell * 6)) * ptrA;
        }
        if (sc[r]) {
          if (boost > 0.05) hot.push([x, y, boost, 1]);
          else { lit.moveTo(x + cell * 0.36, y); lit.arc(x, y, cell * 0.36, 0, 6.2832); }
        } else if (boost > 0.05) hot.push([x, y, boost, 0]);
        else { dim.moveTo(x + cell * 0.14, y); dim.arc(x, y, cell * 0.14, 0, 6.2832); }
      }
    }
    ctx.fillStyle = light ? 'rgba(10,10,10,0.07)' : 'rgba(242,237,232,0.07)';
    ctx.fill(dim);
    ctx.shadowColor = 'rgba(255,78,0,0.55)';
    ctx.shadowBlur = cell * 0.7;
    ctx.fillStyle = ORANGE;
    ctx.fill(lit);
    ctx.shadowBlur = 0;
    for (const [x, y, b, on] of hot) {
      ctx.beginPath();
      if (on) { ctx.fillStyle = `rgba(255,${78 + Math.round(b * 90)},${Math.round(b * 40)},1)`; ctx.arc(x, y, cell * (0.36 + 0.1 * b), 0, 6.2832); }
      else { ctx.fillStyle = light ? `rgba(10,10,10,${0.07 + 0.3 * b})` : `rgba(242,237,232,${0.07 + 0.35 * b})`; ctx.arc(x, y, cell * (0.14 + 0.14 * b), 0, 6.2832); }
      ctx.fill();
    }
  }

  const L = loop((dt) => { if (!reduce.matches || ptr || ptrA > 0.01) draw(dt); });
  const io = watch(cv, L);
  const move = (e) => {
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    const r = cv.getBoundingClientRect();
    ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (reduce.matches) draw(16);
  };
  const leave = () => { ptr = null; if (reduce.matches) draw(16); };
  cv.addEventListener('pointermove', move, { passive: true });
  cv.addEventListener('pointerdown', move, { passive: true });
  cv.addEventListener('pointerleave', leave);
  cv.addEventListener('pointercancel', leave);
  cv.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') leave(); });
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => build()) : null;
  ro?.observe(cv);
  document.addEventListener('outdoor:theme', () => draw(0));
  (document.fonts ? document.fonts.load('40px "Bebas Neue"') : Promise.resolve()).then(build, build);
  return { destroy() { L.stop(); ro?.disconnect(); io?.disconnect(); } };
}

/* ── Squad huddles ─────────────────────────────────────────────── */
export function squad(cv) {
  const HUDDLES = [
    { n: 5, c: '#06C27A', label: '5-A-SIDE' }, { n: 4, c: '#00BFA5', label: 'DOUBLES' },
    { n: 7, c: '#C026D3', label: 'KABADDI' }, { n: 11, c: '#F7B300', label: 'GULLY XI' },
    { n: 2, c: '#1EAEFF', label: 'SINGLES' }, { n: 6, c: '#E5197F', label: 'RUN CLUB' },
  ];
  const MISSING = 3; // the gully XI is one short
  let g, people = [], p = 0, shown = 0, built = false, lab1 = 26, lab2 = 42;

  function build() {
    g = fit(cv);
    const { w, h } = g, cols = w < 640 ? 2 : 3, rws = Math.ceil(HUDDLES.length / cols);
    // Short rows (phones) shrink the huddles and pull the labels in, so rows never collide.
    const rowH = h / rws, sc = Math.max(0.5, Math.min(1, (rowH - 56) / 98));
    lab1 = sc < 1 ? 18 : 26; lab2 = sc < 1 ? 32 : 42;
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    people = [];
    HUDDLES.forEach((hd, i) => {
      const slots = hd.n, R = (14 + slots * 3.2) * sc;
      const cx = ((i % cols) + 0.5) * (w / cols);
      const cy = Math.floor(i / cols) * rowH + (rowH - (2 * R + lab2 + 4)) / 2 + R;
      hd.cx = cx; hd.cy = cy;
      hd.R = R;
      for (let k = 0; k < slots; k++) {
        const a = (k / slots) * 6.283 - 1.57;
        if (i === MISSING && k === slots - 1) { hd.gap = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R }; continue; }
        people.push({ hx: rnd() * w, hy: rnd() * h, tx: cx + Math.cos(a) * R, ty: cy + Math.sin(a) * R, c: hd.c, ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6, st: rnd() * 0.35 });
      }
    });
    for (let k = 0; k < 26; k++) people.push({ hx: rnd() * w, hy: rnd() * h, tx: null, ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6, st: 0 });
    built = true;
  }
  const ease = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

  function draw(dt, now) {
    if (!built) return;
    const { ctx, w, h } = g, t = reduce.matches ? 0 : now / 1000, ink = isLight() ? '10,10,10' : '242,237,232';
    shown += (p - shown) * (reduce.matches ? 1 : Math.min(1, dt / 160));
    ctx.clearRect(0, 0, w, h);
    for (const q of people) {
      const wx = q.hx + Math.sin(t * q.sp + q.ph) * 18, wy = q.hy + Math.cos(t * q.sp * 0.8 + q.ph) * 14;
      let x = wx, y = wy, col = `rgba(${ink},0.28)`, r = 3.5;
      if (q.tx != null) {
        const k = ease((shown - q.st) / 0.6);
        x = wx + (q.tx + Math.sin(t * 2 + q.ph) * 1.5 - wx) * k;
        y = wy + (q.ty - wy) * k;
        if (k > 0.5) { col = q.c; r = 3.5 + 2 * k; }
      }
      ctx.beginPath(); ctx.fillStyle = col; ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    const lab = ease((shown - 0.75) / 0.25);
    if (lab > 0) {
      ctx.font = '600 11px "Space Grotesk", monospace';
      ctx.textAlign = 'center';
      HUDDLES.forEach((hd) => {
        ctx.fillStyle = `rgba(${ink},${0.75 * lab})`;
        ctx.fillText(hd.label, hd.cx, hd.cy + hd.R + lab1);
        if (hd.gap) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 4);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,78,0,${lab * (0.5 + 0.5 * pulse)})`;
          ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
          ctx.arc(hd.gap.x, hd.gap.y, 7 + pulse * 3, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = `rgba(255,78,0,${lab})`;
          ctx.fillText('1 SPOT LEFT', hd.cx, hd.cy + hd.R + lab2);
        }
      });
    }
  }

  const L = loop(draw);
  const io = watch(cv, L);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(build) : null;
  ro?.observe(cv);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
  return {
    set(v) { p = v; if (reduce.matches) L.kick(); },
    destroy() { L.stop(); ro?.disconnect(); io?.disconnect(); },
  };
}

/* ── Confetti ──────────────────────────────────────────────────── */
export function confetti(cv) {
  const COLORS = [ORANGE, '#F7B300', '#06C27A', '#1EAEFF', '#FF3B3B', '#6C3FC4', '#00BFA5'];
  let g = fit(cv), parts = [], raf = 0, last = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(64, now - (last || now) || 16); last = now;
    const { ctx, w, h } = g;
    ctx.clearRect(0, 0, w, h);
    const k = dt / 16;
    parts = parts.filter((q) => q.life > 0);
    for (const q of parts) {
      q.vy += 0.22 * k; q.vx *= 0.985; q.x += q.vx * k; q.y += q.vy * k; q.life -= dt; q.rot += q.vr * k;
      ctx.globalAlpha = Math.max(0, Math.min(1, q.life / 500));
      ctx.fillStyle = q.c;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
      if (q.sq) ctx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s * 0.5);
      else { ctx.beginPath(); ctx.arc(0, 0, q.s / 2, 0, 6.2832); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  window.addEventListener('resize', () => { g = fit(cv); });
  return {
    burst(x, y, n = 140) {
      if (reduce.matches) return;
      g = fit(cv);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, s = 4 + Math.random() * 11;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, c: COLORS[i % COLORS.length], s: 5 + Math.random() * 7, sq: Math.random() > 0.5, life: 1400 + Math.random() * 900, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
  };
}
