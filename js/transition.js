/* ==========================================================
   OUTDOOR — Page transitions
   The prototype's "lanes", across real pages: six lanes with sport-coloured
   tops rise over the page with "NOW ENTERING {PAGE}", the browser navigates,
   and the next page opens under the same cover (the <head> script adds
   html.nav-in before first paint) and lifts it. Links that open elsewhere,
   modifier clicks and in-page anchors are left alone. Off under reduced motion.
   ========================================================== */

import { reduceMotion, holdReveals } from './motion.js';

const root = document.documentElement;
const KEY = 'outdoor-nav';
const LABELS = {
  '': 'HOME', 'index.html': 'HOME', 'story.html': 'OUR STORY', 'about.html': 'OUR STORY',
  'waitlist.html': 'WAITLIST', 'thank-you.html': 'WAITLIST',
  'privacy.html': 'PRIVACY', 'terms.html': 'TERMS', 'delete-account.html': 'DELETE ACCOUNT',
};
const fileOf = (url) => url.pathname.split('/').pop();
const samePage = (a, b) => a.pathname.replace(/index\.html$/, '') === b.pathname.replace(/index\.html$/, '') && a.search === b.search;

const overlay = document.querySelector('.pt');
const dest = overlay?.querySelector('.pt-dest');
let busy = false;
root.classList.add('pt-js');

function lift() {
  holdReveals(true);
  setTimeout(() => {
    root.classList.add('pt-out');
    holdReveals(false);
    setTimeout(() => { root.classList.remove('nav-in', 'pt-out'); busy = false; }, 920);
  }, 380);
}

if (root.classList.contains('nav-in')) {
  try { sessionStorage.removeItem(KEY); } catch (e) { /* private mode */ }
  lift();
}

// Back/forward restores a page from the cache with its cover still drawn.
window.addEventListener('pageshow', (e) => {
  if (!e.persisted || !root.classList.contains('pt-cover')) return;
  root.classList.remove('pt-cover');
  root.classList.add('nav-in');
  lift();
});

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
  const file = fileOf(url);
  if (!(file === '' || file.endsWith('.html'))) return;

  if (samePage(url, window.location)) {
    if (url.hash) return;                        // an anchor on this page
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    return;
  }
  if (busy) { e.preventDefault(); return; }
  if (reduceMotion.matches || !overlay) return;

  e.preventDefault();
  busy = true;
  if (dest) dest.textContent = LABELS[file] ?? 'OUTDOOR';
  document.dispatchEvent(new CustomEvent('outdoor:leave', { detail: { file } }));
  root.classList.add('pt-cover');
  setTimeout(() => {
    try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* private mode */ }
    window.location.href = url.href;
    // If the next page never arrives (offline), don't leave this one covered.
    const stuck = setTimeout(() => { root.classList.remove('pt-cover'); busy = false; }, 6000);
    window.addEventListener('pagehide', () => clearTimeout(stuck), { once: true });
  }, 820);
});
