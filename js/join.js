/* ==========================================================
   OUTDOOR — The waitlist pass
   The card fills in as you type (name, a barcode drawn from what you've
   typed). On join the page swaps in place: the card is stamped ON THE LIST,
   confetti, and the share buttons. The pass is kept for this tab
   (sessionStorage), so a refresh still shows it.
   ========================================================== */

import './site.js';
import { CONFIG } from './config.js';
import { reduceMotion, narrow, scanReveals, refreshPointerTargets, fmt } from './motion.js';
import { confetti } from './fx.js';
import { EMAIL_RE, joinWaitlist } from './waitlist.js';

const PASS_KEY = 'outdoor-pass';
const root = document.documentElement;
const $ = (sel) => document.querySelector(sel);

const form = $('[data-pass-form]');
const formState = $('[data-state="form"]');
const joinedState = $('[data-state="joined"]');
const ticket = $('.ticket');
const nameInput = form?.elements.namedItem('name');
const emailInput = form?.elements.namedItem('email');
const trap = form?.elements.namedItem('company');
const submit = form?.querySelector('button[type="submit"]');
const msg = form?.querySelector('[data-form-msg]');
const tName = $('[data-t-name]'), tSpot = $('[data-t-spot]'), tDate = $('[data-t-date]'), tStatus = $('[data-t-status]');
const barcode = $('[data-barcode]');

/* ── The card fills in as you type ─────────────────────────────── */
const bars = barcode ? Array.from({ length: 34 }, () => barcode.appendChild(document.createElement('span'))) : [];
function drawBars(text) {
  let h = 7;
  for (const ch of text) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  bars.forEach((bar, i) => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    bar.style.width = `${1 + ((h >>> 28) % 3)}px`;
    bar.style.height = `${i % 9 === 0 ? 100 : 62 + ((h >>> 20) % 38)}%`;
  });
}
function drawCard() {
  if (tName) tName.textContent = nameInput?.value.trim() || 'Your name';
  drawBars((nameInput?.value || '') + (emailInput?.value || ''));
}

/* ── Joined: swap the copy, stamp the card, celebrate ──────────── */
const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
let conf = null;

function showJoined(pass, celebrate) {
  const n = pass.position ? `number ${fmt(pass.position)}` : '';
  const where = pass.duplicate
    ? (n ? `You were already on the list, at ${n}.` : 'You were already on the list.')
    : (n ? `You're ${n} on the list.` : "You're on the list.");
  $('[data-joined-name]').textContent = `${pass.name},`;
  $('[data-joined-line]').textContent = `${where} We'll write the moment Outdoor is ready. Until then, bring the people you play with.`;
  $('[data-ok-label]').textContent = pass.duplicate ? 'Already on the waitlist' : "You're on the waitlist";

  if (tName) tName.textContent = pass.name;
  if (tSpot) tSpot.textContent = pass.position ? fmt(pass.position) : '—';
  if (tDate) tDate.textContent = pass.date || today();
  if (tStatus) tStatus.textContent = 'ON THE LIST';
  drawBars(pass.name + (pass.email || ''));
  ticket?.classList.add('is-joined');

  formState.hidden = true;
  joinedState.hidden = false;
  scanReveals(joinedState);
  refreshPointerTargets();
  $('[data-joined-heading]')?.focus({ preventScroll: true });

  if (!celebrate || !ticket) return;
  const cv = $('[data-confetti]');
  if (cv && !conf) conf = confetti(cv);
  const burst = () => {
    const r = ticket.getBoundingClientRect();
    conf?.burst(r.left + r.width / 2, r.top + r.height * 0.45, 180);
  };
  if (narrow.matches) {
    ticket.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    setTimeout(burst, 700);
  } else setTimeout(burst, 260);
}

/* ── The form ──────────────────────────────────────────────────── */
function say(text) { if (msg) msg.textContent = text; }
function invalid(input, text) {
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  say(text);
}
function busy(on) {
  submit.disabled = on;
  submit.innerHTML = on ? '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Joining…</span>' : 'Join the waitlist';
}

if (form) {
  drawCard();
  [nameInput, emailInput].forEach((input) => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    say('');
    drawCard();
  }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    [nameInput, emailInput].forEach((el) => el.removeAttribute('aria-invalid'));
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    const email = emailInput.value.trim();
    if (!name) { invalid(nameInput, 'Add your name so we know who to welcome.'); return; }
    if (!EMAIL_RE.test(email)) { invalid(emailInput, "That email doesn't look right."); return; }
    busy(true);
    say('');
    try {
      const { position, duplicate } = await joinWaitlist({ name, email, company: trap?.value || '' });
      const pass = { name, position, duplicate, date: today() };
      try { sessionStorage.setItem(PASS_KEY, JSON.stringify(pass)); } catch (err) { /* private mode */ }
      showJoined(pass, true);
    } catch (err) {
      busy(false);
      say("We couldn't add you just now. Check your connection and try again.");
    }
  });
}

/* ── Share ─────────────────────────────────────────────────────── */
const wa = $('[data-share-whatsapp]');
if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(`I just joined the Outdoor waitlist. Join me: ${CONFIG.siteUrl}`)}`;
const copy = $('[data-share-copy]');
if (copy) {
  let t = 0;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.siteUrl);
      copy.textContent = 'Link copied ✓';
    } catch (e) {
      copy.textContent = CONFIG.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    clearTimeout(t);
    t = setTimeout(() => { copy.textContent = 'Copy link'; }, 2000);
  });
}

/* ── A pass from earlier in this tab ───────────────────────────── */
if (!root.classList.contains('is-launched')) {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(PASS_KEY) || 'null'); } catch (e) { saved = null; }
  if (saved && saved.name) showJoined(saved, false);
}
