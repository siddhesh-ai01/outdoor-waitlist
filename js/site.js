/* ==========================================================
   OUTDOOR — Shared behaviour for every page
   Theme (dark by default, remembered) · the fixed dot field · header clock
   and nav capsule · page transitions · reveals and pointer effects · the
   footer tagline · launch-day switch.
   ========================================================== */

import { CONFIG } from './config.js';
import { onFrame, scanReveals, initPointerFx, reduceMotion, clamp01 } from './motion.js';
import { initField } from './field.js';
import './transition.js';

const root = document.documentElement;
root.classList.add('js');

/* ── Theme ─────────────────────────────────────────────────────── */
const THEME_KEY = 'outdoor-theme';
function setTheme(theme, save) {
  root.dataset.theme = theme;
  if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ } }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F5F3E8' : '#0A0A0A');
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    btn.dataset.cur = theme === 'light' ? 'DARK' : 'LIGHT';
  });
  document.dispatchEvent(new CustomEvent('outdoor:theme', { detail: theme }));
}
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true));
});
setTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);

/* The countdown is a first-visit moment: any page other than its own run counts as a visit. */
if (!root.classList.contains('intro')) { try { localStorage.setItem('outdoor-intro', '1'); } catch (e) { /* private mode */ } }

/* ── The dot field, fixed behind everything ────────────────────────
   Solid sections cover it, so its blink loop only runs while a
   see-through section ([data-field-zone]) is on screen. */
const fieldHost = document.querySelector('.field');
if (fieldHost) {
  const field = initField(fieldHost, { embers: 'all' });
  const zones = document.querySelectorAll('[data-field-zone]');
  if (zones.length && 'IntersectionObserver' in window) {
    const onScreen = new Set();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); }
      field.setActive(onScreen.size > 0);
    });
    zones.forEach((z) => io.observe(z));
  }
}

/* ── Header ────────────────────────────────────────────────────── */
// "MIN" clock: the match minute is how far down the page you are.
const clock = document.querySelector('[data-clock]');
if (clock) {
  onFrame((vh) => {
    const max = root.scrollHeight - vh;
    const p = max > 0 ? clamp01(window.scrollY / max) : 0;
    clock.textContent = `${String(Math.round(p * 90)).padStart(2, '0')}'`;
  });
}
// The capsule slides to Home/Story as soon as one is clicked, before the cover rises.
const nav = document.querySelector('.hdr-nav');
document.addEventListener('outdoor:leave', (e) => {
  if (!nav) return;
  const i = { '': 0, 'index.html': 0, 'story.html': 1 }[e.detail.file];
  if (i === undefined) return;
  nav.dataset.cap = String(i);
  nav.style.setProperty('--cap', String(i));
  nav.querySelectorAll('a').forEach((a, k) => a.classList.toggle('is-current', k === i));
});

/* ── Footer: the tagline writes itself in as it comes up ───────── */
const tagline = document.querySelector('[data-script]');
if (tagline) {
  onFrame((vh) => {
    if (reduceMotion.matches) { tagline.style.clipPath = 'none'; return; }
    const r = tagline.getBoundingClientRect();
    // Written by the time the whole line is in view, and always by the bottom of the page
    // (the footer can't scroll any higher, so a later finish line could never be reached).
    const atEnd = window.scrollY + vh >= root.scrollHeight - 2;
    const p = atEnd ? 1 : clamp01((vh - r.top) / (r.height + vh * 0.2));
    // The clip reaches 0.6em past the left edge so the L's swash isn't cut, and it is
    // dropped altogether once the line is written, so no stroke is ever clipped at rest.
    tagline.style.clipPath = p >= 0.999 ? 'none'
      : `inset(-30% calc(${(1 - p).toFixed(3)} * (100% + 0.6em)) -40% -0.6em)`;
  });
}

/* ── Footer details ────────────────────────────────────────────── */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll('[data-email]').forEach((el) => {
  if (el.tagName === 'A') el.href = `mailto:${CONFIG.email}`;
  if (!el.children.length) el.textContent = CONFIG.email;
});
document.querySelectorAll('[data-social]').forEach((el) => {
  const url = CONFIG.social[el.dataset.social];
  if (url) el.href = url; else el.remove();
});

/* ── Launch-day switch ─────────────────────────────────────────── */
if (CONFIG.storeUrl) {
  root.classList.add('is-launched');
  document.querySelectorAll('[data-cta="join"]').forEach((a) => {
    a.href = CONFIG.storeUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    const full = a.querySelector('.cta-full'), short = a.querySelector('.cta-short');
    if (full || short) { if (full) full.textContent = 'Get the app'; if (short) short.textContent = 'Get app'; }
    else if (!a.children.length) a.textContent = a.dataset.ctaStore || 'Get the app';   // richer links carry [data-launch-text] inside
  });
  document.querySelectorAll('[data-launch-text]').forEach((el) => { el.textContent = el.dataset.launchText; });
  document.querySelectorAll('[data-launch="waitlist"]').forEach((el) => { el.hidden = true; });
  document.querySelectorAll('[data-launch="store"]').forEach((el) => { el.hidden = false; });
}

/* ── Reveals and pointer effects ───────────────────────────────── */
scanReveals();
initPointerFx();
