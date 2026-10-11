/* ==========================================================
   OUTDOOR — Waitlist
   Talks to the Google Apps Script in APPS_SCRIPT.js.

   The POST is a CORS "simple request" (URL-encoded body, no custom headers),
   so the script's JSON reply is readable: the position comes back in the
   same response that wrote the row, and repeat sign-ups are recognised.
   Works with the original script (v1: {success, count, duplicate}) and with
   v2 ({ok, position, duplicate, v: 2}); the city step needs v2.
   ========================================================== */

import { CONFIG } from './config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const JOIN_KEY = 'outdoor-join';
const fmt = (n) => Number(n).toLocaleString('en-IN');

/* ── Count ─────────────────────────────────────────────────────── */
export async function fetchCount() {
  try {
    const res = await fetch(CONFIG.scriptUrl, { method: 'GET' });
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch (e) {
    return null;
  }
}

/** Fill every [data-count]; reveal its [data-count-wrap] only once there is a number. */
export function initCount() {
  const slots = document.querySelectorAll('[data-count]');
  if (!slots.length) return;
  fetchCount().then((n) => {
    if (n === null) return;
    slots.forEach((el) => { el.textContent = fmt(n); });
    document.querySelectorAll('[data-count-wrap]').forEach((w) => w.classList.remove('is-loading'));
  });
}

/* ── Join form ─────────────────────────────────────────────────── */
function setMessage(form, text, isError) {
  const msg = form.querySelector('[data-form-msg]');
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle('is-error', !!isError);
}
function invalid(form, input, text) {
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  setMessage(form, text, true);
}

async function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const nameInput = form.elements.namedItem('name');
  const emailInput = form.elements.namedItem('email');
  const trap = form.elements.namedItem('company');
  const button = form.querySelector('button[type="submit"]');
  [nameInput, emailInput].forEach((el) => el.removeAttribute('aria-invalid'));

  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const email = emailInput.value.trim();
  if (!name) return invalid(form, nameInput, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) return invalid(form, emailInput, 'Please enter a valid email address.');

  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Joining…';
  setMessage(form, '');

  try {
    const res = await fetch(CONFIG.scriptUrl, {
      method: 'POST',
      body: new URLSearchParams({ name, email, company: trap ? trap.value : '' }),
    });
    const data = await res.json();
    if (!(data.ok || data.success)) throw new Error(data.error || 'rejected');

    // v2 returns the row's own position, also for a repeat sign-up. v1 only
    // returns the total, which is the position of a NEW row and wrong for a repeat.
    const position = data.position ?? (data.duplicate ? null : data.count);
    try { sessionStorage.setItem(JOIN_KEY, JSON.stringify({ email, v: data.v || 1 })); } catch (e) { /* private mode */ }

    const query = new URLSearchParams({ name: name.split(' ')[0] });
    if (Number(position) > 0) query.set('position', String(position));
    if (data.duplicate) query.set('again', '1');
    window.location.href = `thank-you.html?${query}`;
  } catch (e) {
    button.disabled = false;
    button.textContent = label;
    setMessage(form, "We couldn't add you just now. Check your connection and try again.", true);
  }
}

export function initForms() {
  document.querySelectorAll('form[data-waitlist]').forEach((form) => {
    form.addEventListener('submit', onSubmit);
    form.querySelectorAll('.input').forEach((input) => input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      setMessage(form, '');
    }));
  });
}

/* ── Thank-you page ────────────────────────────────────────────── */
function ordinalLine(position, again) {
  const n = `#${fmt(position)}`;
  return again ? ['You were already on the list, at ', n, '.'] : ["You're ", n, ' on the list.'];
}

export function initThankYou() {
  const params = new URLSearchParams(window.location.search);
  const name = (params.get('name') || '').trim().slice(0, 40);
  const position = Number(params.get('position'));
  const again = params.get('again') === '1';

  const nameEl = document.querySelector('[data-ty-name]');
  if (nameEl) {
    if (name) nameEl.textContent = name;
    else nameEl.hidden = true;
  }
  const line = document.querySelector('[data-ty-line]');
  if (line) {
    line.replaceChildren();
    if (position > 0) {
      const [a, n, b] = ordinalLine(position, again);
      const strong = document.createElement('b');
      strong.textContent = n;
      line.append(a, strong, b);
    } else {
      line.textContent = again ? 'You were already on the list.' : "You're on the list.";
    }
  }

  initShare();
  initCity();
}

function initShare() {
  const text = `I just joined the Outdoor waitlist, one app for every sport. Follow your teams, catch the day's news and book a court: ${CONFIG.siteUrl}`;
  const wa = document.querySelector('[data-share-whatsapp]');
  if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const copy = document.querySelector('[data-share-copy]');
  if (copy) {
    copy.addEventListener('click', async () => {
      const original = copy.textContent;
      try {
        await navigator.clipboard.writeText(CONFIG.siteUrl);
        copy.textContent = 'Link copied';
      } catch (e) {
        copy.textContent = CONFIG.siteUrl;
      }
      setTimeout(() => { copy.textContent = original; }, 2200);
    });
  }
}

/* City: one optional question, saved to the same row (APPS_SCRIPT.js v2). */
function initCity() {
  const box = document.querySelector('[data-city]');
  if (!box) return;
  let join = null;
  try { join = JSON.parse(sessionStorage.getItem(JOIN_KEY) || 'null'); } catch (e) { join = null; }
  if (!join || join.v < 2 || !join.email) return;   // needs the v2 script and this visitor's email
  box.hidden = false;

  const status = box.querySelector('[data-city-status]');
  const otherWrap = box.querySelector('[data-city-other]');
  const otherInput = otherWrap?.querySelector('input');
  const buttons = box.querySelectorAll('[data-city-value]');

  const save = async (city) => {
    buttons.forEach((b) => { b.disabled = true; });
    status.textContent = 'Saving…';
    try {
      const res = await fetch(CONFIG.scriptUrl, {
        method: 'POST',
        body: new URLSearchParams({ action: 'city', email: join.email, city }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'rejected');
      box.querySelector('[data-city-ask]').hidden = true;
      status.textContent = `Saved: ${city}. Thank you.`;
      try { sessionStorage.removeItem(JOIN_KEY); } catch (e) { /* ignore */ }
    } catch (e) {
      buttons.forEach((b) => { b.disabled = false; });
      status.textContent = "That didn't save. Try once more?";
    }
  };

  buttons.forEach((btn) => btn.addEventListener('click', () => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    if (btn.dataset.cityValue === 'other') {
      otherWrap.hidden = false;
      otherInput.focus();
      return;
    }
    otherWrap.hidden = true;
    save(btn.dataset.cityValue);
  }));
  otherWrap?.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = otherInput.value.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (city) save(city);
    else otherInput.focus();
  });
}
