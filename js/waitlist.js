/* ==========================================================
   OUTDOOR — Waitlist backend client
   Talks to the Google Apps Script in APPS_SCRIPT.js.

   The POST is a CORS "simple request" (URL-encoded body, no custom headers),
   so the script's JSON reply is readable: the position comes back in the same
   response that wrote the row, and repeat sign-ups are recognised.
   Works with the live script (v1: {success, count, duplicate}) and would
   work with a newer one that returns {ok, position, duplicate}.
   ========================================================== */

import { CONFIG } from './config.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** How many people are waiting, or null if the script can't be reached. */
export async function fetchCount() {
  try {
    const res = await fetch(CONFIG.scriptUrl, { method: 'GET' });
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch (e) {
    return null;
  }
}

/**
 * Add someone to the list. Resolves { position, duplicate }; throws if the
 * script refuses or can't be reached.
 */
export async function joinWaitlist({ name, email, company = '' }) {
  const res = await fetch(CONFIG.scriptUrl, {
    method: 'POST',
    body: new URLSearchParams({ name, email, company }),
  });
  const data = await res.json();
  if (!(data.ok || data.success)) throw new Error(data.error || 'rejected');
  // A newer script returns the row's own position, repeats included. v1 returns
  // only the total, which is the position of a NEW row and wrong for a repeat.
  const position = Number(data.position ?? (data.duplicate ? null : data.count));
  return { position: position > 0 ? position : null, duplicate: !!data.duplicate };
}
