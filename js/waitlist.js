/* ==========================================================
   OUTDOOR — Waitlist Form Handler
   Google Apps Script integration for all forms on any page.

   HOW TO SET UP:
   1. Open your Google Sheet → Extensions → Apps Script
   2. Paste the contents of APPS_SCRIPT.js
   3. Deploy as Web App (Execute as: Me, Access: Anyone)
   4. Copy the deployment URL and paste it below as SCRIPT_URL
   ========================================================== */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhJye9SV5OThRyqiYKhGPPcFb_V1doSXBs83ONe2yj2MIEzHbee5bIiUDg8i1YrzMG/exec';

/* ── Helper: fetch current count (GET) ─────────────────── */
async function fetchCount() {
  // Guard only fires when the URL is still the default placeholder
  if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') return null;
  try {
    const res  = await fetch(SCRIPT_URL, { method: 'GET', mode: 'cors' });
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}

/* ── Helper: update count displays on the current page ─── */
async function refreshCount() {
  const count = await fetchCount();
  if (count === null) return;
  document.querySelectorAll('[id$="-count"], .count-num').forEach(el => {
    el.textContent = count.toLocaleString('en-IN');
  });
}

/* ── Helper: submit form then redirect to thank-you page ── */
async function submitForm(name, email, msgEl, btn) {
  // Guard only fires when the URL is still the default placeholder
  if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    showMsg(msgEl, '⚠ Script URL not configured yet.', 'error');
    return;
  }

  const body = new URLSearchParams({ name: name.trim(), email: email.trim() }).toString();

  // mode: 'no-cors' bypasses CORS preflight — response will be opaque (that's fine)
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    // Briefly update button state while we fetch the position
    if (btn) {
      btn.querySelector('.btn-text').textContent = 'You\'re in ✓';
      btn.style.background = 'var(--green)';
    }

    // Fetch count → this is the user's waitlist position
    const count = await fetchCount();

    // Redirect to the thank-you page with name + position as URL params
    const redirectParams = new URLSearchParams({ name: name.trim() });
    if (count !== null) redirectParams.set('position', count);
    window.location.href = 'thank-you.html?' + redirectParams.toString();

  } catch (err) {
    showMsg(msgEl, '❌ Something went wrong. Please try again.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Get early access';
    }
  }
}

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg ' + type;
}

/* ── Attach to any .waitlist-form on the page ─────────── */
document.addEventListener('DOMContentLoaded', function () {

  // Load live count on page load
  refreshCount();

  document.querySelectorAll('.waitlist-form').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nameEl  = form.querySelector('input[name="name"]');
      const emailEl = form.querySelector('input[name="email"]');
      const msgEl   = form.querySelector('.form-msg');
      const btn     = form.querySelector('button[type="submit"]');

      const name  = nameEl  ? nameEl.value.trim()  : '';
      const email = emailEl ? emailEl.value.trim() : '';

      // Basic validation
      if (!name) {
        nameEl.focus();
        showMsg(msgEl, 'Please enter your name.', 'error');
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.focus();
        showMsg(msgEl, 'Please enter a valid email address.', 'error');
        return;
      }

      // Loading state
      if (btn) {
        btn.disabled = true;
        const textEl = btn.querySelector('.btn-text');
        if (textEl) textEl.textContent = 'Submitting…';
      }
      showMsg(msgEl, '', '');

      await submitForm(name, email, msgEl, btn);
      // Note: on success we redirect to thank-you.html, so no need to clear inputs here
    });
  });

});
