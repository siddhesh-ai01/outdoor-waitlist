/* ==========================================================
   OUTDOOR — Shared behaviour for every page
   Theme (dark by default, remembered) · glass header · CTA hand-off ·
   scroll reveals · launch-day switch · mascots.
   ========================================================== */

import { CONFIG } from './config.js';
import { mountAll } from './mascot.js';

const root = document.documentElement;
root.classList.add('js');

/* ── Theme ─────────────────────────────────────────────────────── */
const THEME_KEY = 'outdoor-theme';
function setTheme(theme) {
  root.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F5F3E8' : '#0A0A0A');
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  });
  document.dispatchEvent(new CustomEvent('outdoor:theme', { detail: theme }));
}
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
});
setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');

/* ── Header: glass once the page moves ─────────────────────────── */
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── CTA hand-off ──────────────────────────────────────────────────
   One orange action per screen: while the page's own CTA ([data-page-cta])
   or a waitlist form ([data-cta-zone]) is visible, the header button stays
   outlined and the phone dock stays away. Once neither is on screen, the
   header button turns orange on desktop and the dock rises on phones. */
const watched = document.querySelectorAll('[data-page-cta], [data-cta-zone]');
if (watched.length && 'IntersectionObserver' in window) {
  const onScreen = new Set();
  const update = () => root.classList.toggle('cta-docked', onScreen.size === 0 && window.scrollY > 120);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); }
    update();
  }, { rootMargin: '-64px 0px 0px 0px' });
  watched.forEach((el) => io.observe(el));
  window.addEventListener('scroll', update, { passive: true });
} else {
  root.classList.add('cta-docked');
}

/* ── Scroll reveals (content is visible without JS) ────────────── */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

/* ── Footer details ────────────────────────────────────────────── */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
document.querySelectorAll('[data-email]').forEach((el) => {
  const label = el.children.length ? el.querySelector('.label') : el;
  if (label) label.textContent = CONFIG.email;
  if (el.tagName === 'A') el.href = `mailto:${CONFIG.email}`;
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
    const long = a.querySelector('.cta-full'), short = a.querySelector('.cta-short');
    if (long || short) { if (long) long.textContent = 'Get the app'; if (short) short.textContent = 'Get app'; }
    else a.textContent = 'Get the app';
  });
  document.querySelectorAll('[data-launch="waitlist"]').forEach((el) => { el.hidden = true; });
  document.querySelectorAll('[data-launch="store"]').forEach((el) => { el.hidden = false; });
}

/* ── Mascots ───────────────────────────────────────────────────── */
mountAll();
