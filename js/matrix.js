/* ==========================================================
   OUTDOOR — Dot-Matrix Animations

   MatrixCanvas — foreground morphing shapes canvas.
     • Default shape-set (index page): sports-ecosystem icons
       (Following, Venue, Media, Co-playing, Multiple Sports)
     • Sports shape-set (about page):  sport silhouettes
       (Cricket, Football, Basketball, Badminton, Chess, Hockey)
     Pass  data-shapes="sports"  on the <canvas> element to
     switch to the sports set; omit for the default set.

   HeroBgMatrix — full-hero ambient dot field (both pages).
     Dot size is always derived from the foreground canvas so
     both grids share the exact same physical dot size.
   ========================================================== */

(function () {

  const CANVAS_ID   = 'matrix-canvas';
  const LABEL_ID    = 'canvas-label';
  const MORPH_DELAY = 2000;
  const COLS        = 30;
  const ROWS        = 30;

  /* ── Shared grid utilities ──────────────────────────────────── */
  function circleMask(cx, cy, r) {
    const pts = [];
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) {
        const dx = col - cx, dy = row - cy;
        if (dx * dx + dy * dy <= r * r) pts.push([col, row]);
      }
    return pts;
  }

  function rectMask(x1, y1, x2, y2) {
    const pts = [];
    for (let row = Math.max(0, y1); row <= Math.min(ROWS - 1, y2); row++)
      for (let col = Math.max(0, x1); col <= Math.min(COLS - 1, x2); col++)
        pts.push([col, row]);
    return pts;
  }

  function dedup(pts) {
    const seen = new Set();
    return pts.filter(([c, r]) => {
      const key = c + ',' + r;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }


  /* ══════════════════════════════════════════════════════════
     DEFAULT SHAPES — sports-ecosystem icons (index page)
  ══════════════════════════════════════════════════════════ */

  function getFollowing() {
    const pts = [];
    pts.push(...circleMask(15, 7, 4));
    pts.push(...rectMask(10, 12, 20, 19));
    for (let r = 20; r <= 27; r++) pts.push([11,r],[12,r],[13,r]);
    for (let r = 20; r <= 27; r++) pts.push([17,r],[18,r],[19,r]);
    return pts;
  }

  function getVenue() {
    const pts = [];
    const cx = 15, cy = 11;
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++) {
        const dx = col - cx, dy = row - cy, d = dx*dx + dy*dy;
        if (d <= 64 && d >= 16) pts.push([col, row]);
      }
    for (let r = cy + 8; r <= cy + 18; r++) {
      const spread = Math.max(0, Math.floor((cy + 18 - r) * 0.35));
      for (let c = cx - spread; c <= cx + spread; c++) pts.push([c, r]);
    }
    return pts;
  }

  function getMedia() {
    const pts = [];
    for (let c = 2; c <= 28; c++) { pts.push([c, 4]); pts.push([c, 26]); }
    for (let r = 5; r <= 25; r++) { pts.push([2, r]); pts.push([28, r]); }
    for (let r = 9; r <= 21; r++) {
      const maxC = 10 + (6 - Math.abs(r - 15)) * 2;
      for (let c = 10; c <= maxC; c++) pts.push([c, r]);
    }
    return pts;
  }

  function getHandshake() {
    const pts = [];
    pts.push(...rectMask(2, 13, 13, 21));
    pts.push(...rectMask(17, 13, 28, 21));
    pts.push(...rectMask(11, 14, 19, 20));
    for (let r = 9; r <= 13; r++) {
      pts.push([4,r],[5,r],[8,r],[9,r]);
      pts.push([20,r],[21,r],[24,r],[25,r]);
    }
    return pts;
  }

  function getMultipleSports() {
    const pts = [];
    pts.push(...rectMask(5, 0, 7, 3));
    pts.push(...rectMask(4, 4, 8, 5));
    pts.push(...rectMask(1, 6, 12, 13));
    const rcx = 22, rcy = 3;
    for (let r = 0; r <= 7; r++)
      for (let c = 16; c <= 29; c++) {
        const dx = c - rcx, dy = r - rcy;
        if (dx*dx/20.25 + dy*dy/9 <= 1 && dx*dx/9 + dy*dy/3.24 > 1) pts.push([c, r]);
      }
    pts.push(...rectMask(21, 8, 22, 9), ...rectMask(21, 10, 22, 13));
    pts.push(...circleMask(6, 22, 6));
    pts.push(...rectMask(16, 23, 21, 28), ...rectMask(16, 19, 21, 22), ...rectMask(17, 17, 20, 18));
    pts.push(...rectMask(23, 23, 28, 28), ...rectMask(23, 19, 28, 22), ...rectMask(24, 17, 27, 18));
    return pts;
  }

  const SHAPES = [
    getFollowing(), getVenue(), getMedia(), getHandshake(), getMultipleSports(),
  ];
  const SHAPE_LABELS = ['Following', 'Venue', 'Media', 'Co-playing', 'Multiple Sports'];


  /* ══════════════════════════════════════════════════════════
     SPORTS SHAPES — sport silhouettes (about page)
  ══════════════════════════════════════════════════════════ */

  /* ── Cricket: bat + ball ──────────────────────────── */
  function getSportCricket() {
    const pts = [];
    pts.push(...rectMask(14, 0, 15, 5));     // handle (thin)
    pts.push(...rectMask(11, 6, 18, 8));     // shoulder (widening)
    pts.push(...rectMask(8,  9, 21, 26));    // blade (wide)
    pts.push(...circleMask(24, 3, 3));       // ball (top-right)
    return pts;
  }

  /* ── Football: solid circle ───────────────────────── */
  function getSportFootball() {
    return circleMask(15, 15, 12);
  }

  /* ── Basketball: ring + two seam lines ───────────── */
  function getSportBasketball() {
    const pts = [];
    // Hollow ring (outer r=12, inner r=9)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const dx = c-15, dy = r-15, d = dx*dx + dy*dy;
        if (d <= 144 && d >= 81) pts.push([c, r]);
      }
    // Horizontal seam
    for (let c = 4; c <= 25; c++) pts.push([c, 15]);
    // Vertical seam
    for (let r = 4; r <= 25; r++) pts.push([15, r]);
    return pts;
  }

  /* ── Badminton: hollow oval head + long handle ────── */
  function getSportBadminton() {
    const pts = [];
    const cx = 15, cy = 9;
    // Hollow ellipse (outer rx=7 ry=6, inner rx=5 ry=4)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const dx = c - cx, dy = r - cy;
        if (dx*dx/49 + dy*dy/36 <= 1 &&
            dx*dx/25 + dy*dy/16 >  1) pts.push([c, r]);
      }
    pts.push(...rectMask(14, 16, 15, 17));   // throat
    pts.push(...rectMask(14, 18, 15, 27));   // handle
    pts.push(...rectMask(13, 25, 16, 29));   // grip (slightly wider at end)
    return pts;
  }

  /* ── Chess king: cross + crown + body + wide base ── */
  function getSportChessKing() {
    const pts = [];
    pts.push(...rectMask(14,  0, 15,  6));   // cross — vertical
    pts.push(...rectMask(11,  2, 18,  3));   // cross — horizontal
    pts.push(...rectMask(11,  7, 18, 10));   // crown swell
    pts.push(...rectMask(12, 11, 17, 21));   // body
    pts.push(...rectMask( 8, 22, 21, 26));   // wide base
    return pts;
  }

  /* ── Hockey: angled shaft + hook + ball ──────────── */
  function getSportHockey() {
    const pts = [];
    // Shaft — slight rightward lean as it descends
    for (let r = 0; r <= 20; r++) {
      const c = 14 + Math.round(r * 0.15);
      if (c < COLS)     pts.push([c, r]);
      if (c + 1 < COLS) pts.push([c + 1, r]);
    }
    // Hook — horizontal bar going right
    pts.push(...rectMask(16, 21, 26, 23));
    // Hook tip — small downward curve
    pts.push(...rectMask(24, 24, 27, 26));
    // Ball
    pts.push(...circleMask(7, 24, 3));
    return pts;
  }

  const ABOUT_SHAPES = [
    getSportCricket(),
    getSportFootball(),
    getSportBasketball(),
    getSportBadminton(),
    getSportChessKing(),
    getSportHockey(),
  ];
  const ABOUT_LABELS = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Chess', 'Hockey'];


  /* ══════════════════════════════════════════════════════════
     MatrixCanvas — foreground morphing shapes
  ══════════════════════════════════════════════════════════ */

  class MatrixCanvas {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement|null}  labelEl
     * @param {Array}             shapes  - array of point arrays
     * @param {string[]}          labels  - display names matching shapes
     */
    constructor(canvas, labelEl, shapes, labels) {
      this.canvas   = canvas;
      this.ctx      = canvas.getContext('2d');
      this.labelEl  = labelEl;
      this.shapes   = shapes || SHAPES;
      this.labels   = labels || SHAPE_LABELS;
      this.shapeIdx = 0;
      this.dots     = [];
      this.raf      = null;
      this.timer    = null;

      this.resize();
      this.buildDots();
      this.loadShape(0, false);
      this.loop();
      this.scheduleMorph();

      window.addEventListener('resize', () => {
        this.resize();
        this.buildDots();
        this.loadShape(this.shapeIdx, false);
      });
    }

    resize() {
      const size      = this.canvas.parentElement.clientWidth || 560;
      this.canvas.width  = size;
      this.canvas.height = size;
      this.spacing = size / (COLS + 1);
      this.dotR    = Math.max(3.0, this.spacing * 0.28);
    }

    buildDots() {
      this.dots = [];
      for (let row = 0; row < ROWS; row++)
        for (let col = 0; col < COLS; col++)
          this.dots.push({
            col, row,
            x: this.spacing + col * this.spacing,
            y: this.spacing + row * this.spacing,
            opacity: 0.04,
            targetOpacity: 0.04,
            delay: 0,
          });
    }

    loadShape(idx, animate = true) {
      const now       = performance.now();
      const activeSet = new Set(dedup(this.shapes[idx]).map(([c, r]) => c + ',' + r));

      this.dots.forEach(dot => {
        const active = activeSet.has(dot.col + ',' + dot.row);
        dot.targetOpacity = active ? 0.92 : 0.04;
        dot.active = active;
        dot.delay  = animate ? now + Math.random() * 250 : 0;
      });

      if (this.labelEl) {
        this.labelEl.style.opacity = '0';
        setTimeout(() => {
          if (this.labelEl) {
            this.labelEl.textContent = this.labels[idx];
            this.labelEl.style.transition = 'opacity 0.4s ease';
            this.labelEl.style.opacity = '1';
          }
        }, 280);
      }
    }

    scheduleMorph() {
      this.timer = setTimeout(() => {
        this.shapeIdx = (this.shapeIdx + 1) % this.shapes.length;
        this.loadShape(this.shapeIdx, true);
        this.scheduleMorph();
      }, MORPH_DELAY);
    }

    loop() {
      const now = performance.now();
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const dimR = isDark ? 242 : 10, dimG = isDark ? 237 : 10, dimB = isDark ? 200 : 42;

      this.dots.forEach(dot => {
        if (now >= dot.delay) {
          const diff = dot.targetOpacity - dot.opacity;
          if (Math.abs(diff) > 0.002) dot.opacity += diff * 0.14;
          else dot.opacity = dot.targetOpacity;
        }
        if (dot.opacity < 0.005) return;

        const a = dot.opacity;
        ctx.fillStyle = (dot.active || dot.opacity > 0.35)
          ? `rgba(255,78,0,${a})`
          : `rgba(${dimR},${dimG},${dimB},${a})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, this.dotR, 0, Math.PI * 2);
        ctx.fill();
      });

      this.raf = requestAnimationFrame(() => this.loop());
    }

    destroy() { cancelAnimationFrame(this.raf); clearTimeout(this.timer); }
  }


  /* ══════════════════════════════════════════════════════════
     HeroBgMatrix — ambient full-hero dot field (both pages)

     Dot size is derived from the paired foreground canvas so
     both grids always share the exact same physical dot size.
     Behaviour is identical on every page — subtle twinkling
     with rare orange sparks.
  ══════════════════════════════════════════════════════════ */

  class HeroBgMatrix {
    constructor(bgCanvas, fgCanvas) {
      this.canvas   = bgCanvas;
      this.fgCanvas = fgCanvas;
      this.ctx      = bgCanvas.getContext('2d');
      this.dots     = [];
      this.raf      = null;

      this.resize();
      this.buildDots();
      this.loop();

      this._onResize = () => { this.resize(); this.buildDots(); };
      window.addEventListener('resize', this._onResize);
    }

    resize() {
      const hero = this.canvas.parentElement;
      const w    = hero.clientWidth  || window.innerWidth;
      const h    = hero.clientHeight || window.innerHeight;

      this.canvas.width  = w;
      this.canvas.height = h;
      this.w = w;
      this.h = h;

      /* Match foreground dot metrics so the two grids read as one. */
      const fgSize = this.fgCanvas
        ? (this.fgCanvas.parentElement.clientWidth || 560)
        : Math.min(Math.max(w * 0.47, 300), 560);

      this.spacing = fgSize / (COLS + 1);
      this.dotR    = Math.max(3.0, this.spacing * 0.28);
      this.cols    = Math.floor(w / this.spacing) + 2;
      this.rows    = Math.floor(h / this.spacing) + 2;
    }

    buildDots() {
      const now = performance.now();
      this.dots = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const base = 0.03 + Math.random() * 0.015;
          this.dots.push({
            x:             c * this.spacing,
            y:             r * this.spacing,
            opacity:       base,
            targetOpacity: base,
            speed:         0.020 + Math.random() * 0.028,
            isOrange:      false,
            nextChange:    now + Math.random() * 6000,
          });
        }
      }
    }

    loop() {
      const now = performance.now();
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const bR = isDark ? 242 : 10;
      const bG = isDark ? 237 : 10;
      const bB = isDark ? 200 : 42;

      this.dots.forEach(dot => {

        if (now >= dot.nextChange) {
          const rnd = Math.random();
          if (rnd < 0.025) {
            dot.targetOpacity = 0.20 + Math.random() * 0.14;
            dot.isOrange      = true;
            dot.speed         = 0.09;
            dot.nextChange    = now + 500 + Math.random() * 900;
          } else if (rnd < 0.18) {
            dot.targetOpacity = 0.07 + Math.random() * 0.06;
            dot.isOrange      = false;
            dot.speed         = 0.025 + Math.random() * 0.025;
            dot.nextChange    = now + 1200 + Math.random() * 2400;
          } else {
            dot.targetOpacity = 0.025 + Math.random() * 0.025;
            dot.isOrange      = false;
            dot.speed         = 0.018 + Math.random() * 0.020;
            dot.nextChange    = now + 2500 + Math.random() * 4000;
          }
        }

        const diff = dot.targetOpacity - dot.opacity;
        if (Math.abs(diff) > 0.0008) dot.opacity += diff * dot.speed;
        else dot.opacity = dot.targetOpacity;

        if (dot.opacity < 0.004) return;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, this.dotR, 0, Math.PI * 2);
        ctx.fillStyle = (dot.isOrange && dot.opacity > 0.08)
          ? `rgba(255,78,0,${dot.opacity.toFixed(3)})`
          : `rgba(${bR},${bG},${bB},${dot.opacity.toFixed(3)})`;
        ctx.fill();
      });

      this.raf = requestAnimationFrame(() => this.loop());
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this._onResize);
    }
  }


  /* ══════════════════════════════════════════════════════════
     Boot
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {

    // ① Foreground morphing canvas.
    //    data-shapes="sports" → use the sport silhouettes (about page).
    //    No attribute         → use the default ecosystem shapes (index page).
    const fgCanvas = document.getElementById(CANVAS_ID);
    const labelEl  = document.getElementById(LABEL_ID);
    if (fgCanvas) {
      const useSports = fgCanvas.dataset.shapes === 'sports';
      new MatrixCanvas(
        fgCanvas, labelEl,
        useSports ? ABOUT_SHAPES : SHAPES,
        useSports ? ABOUT_LABELS : SHAPE_LABELS
      );
    }

    // ② Background ambient canvas (any page with hero-bg-canvas).
    const bgCanvas = document.getElementById('hero-bg-canvas');
    if (bgCanvas) {
      requestAnimationFrame(() => new HeroBgMatrix(bgCanvas, fgCanvas));
    }
  });

})();
