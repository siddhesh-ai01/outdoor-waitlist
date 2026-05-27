/* ==========================================================
   OUTDOOR — Panel depth effect + Phases animation
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ═══════════════════════════════════════════════════════════
     PANEL TRACK — layered card-stack depth on scroll

     Maths:
       t = (scrollPastTrackTop / vh) - panelIndex
       t < 0  → panel is incoming (below, scrolling up)
       0≤t≤1  → panel is outgoing (stuck at top, being covered)
       t > 1  → panel is buried (fully covered)

     Outgoing: scale 1→0.80  (shrinks from center → equal gap on all 4 sides,
                               top gap clearly visible) + subtle rightward drift
     Incoming: scale 0.80→1  (advances forward, no horizontal drift)
     ═══════════════════════════════════════════════════════════ */

  const panelTrack = document.getElementById('features');
  const panels     = panelTrack
    ? Array.from(panelTrack.querySelectorAll('.feature-panel'))
    : [];

  if (panelTrack && panels.length) {
    let rafPending = false;

    function applyDepth() {
      const rect   = panelTrack.getBoundingClientRect();
      const scroll = -rect.top;          // px scrolled past panel-track top
      const vh     = window.innerHeight;

      panels.forEach(function (panel, i) {
        var t = (scroll - i * vh) / vh;  // local progress for panel i

        var scale, ty;

        var tx;

        if (t <= 0) {
          /* ── Incoming: panel scrolling up from below ── */
          var entry = Math.max(0, 1 + t);  // 0 → 1 as panel enters
          scale = 0.80 + 0.20 * entry;     // 0.80 → 1.00
          tx    = 0;
        } else if (t <= 1) {
          /* ── Outgoing: panel stuck, next one sliding over it ──
             scale(0.80) from center → 10svh dark gap appears at the TOP
             (no translateY so the gap is not cancelled out)
             subtle translateX gives the "card placed back in deck" drift  */
          scale = 1 - 0.20 * t;            // 1.00 → 0.80
          tx    = 2 * t;                   // 0 → 2vw rightward drift
        } else {
          /* ── Buried: fully covered by later panels ── */
          scale = 0.80;
          tx    = 2;
        }

        panel.style.transform =
          'translateX(' + tx.toFixed(3) + 'vw) scale(' + scale.toFixed(4) + ')';
      });
    }

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () {
        applyDepth();
        rafPending = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', applyDepth, { passive: true });
    applyDepth(); // set initial state before first scroll
  }


  /* ═══════════════════════════════════════════════════════════
     PHASES — connector line draw + node stagger reveal
     ═══════════════════════════════════════════════════════════ */

  const phaseNodes     = document.querySelectorAll('.phase-node[data-phase]');
  const trackContainer = document.getElementById('phases-track-container');

  /* Phase nodes: staggered IntersectionObserver reveal */
  if ('IntersectionObserver' in window && phaseNodes.length) {
    var nodeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          nodeObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    phaseNodes.forEach(function (n) { nodeObs.observe(n); });
  } else {
    phaseNodes.forEach(function (n) { n.classList.add('visible'); });
  }

  /* Connector line: draw on scroll-into-view */
  if ('IntersectionObserver' in window && trackContainer) {
    var lineObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          trackContainer.classList.add('visible');
          lineObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    lineObs.observe(trackContainer);
  }

});
