/**
 * ============================================================
 * OUTDOOR — Waitlist backend (Google Apps Script) · v2
 * ============================================================
 *
 * Sheet layout, row 1 headers:
 *   A: Timestamp    B: Name    C: Email    D: City
 *
 * What v2 adds over v1
 *  - Every reply says where the person is on the list, repeat sign-ups included.
 *  - A lock stops two people joining at the same moment from getting one number.
 *  - Text that would start a spreadsheet formula (= + - @) is stored as plain text.
 *  - The thank-you page can save an optional city to the same row (column D).
 *    It is write-once, so nobody can overwrite someone else's answer.
 *  - Bots that fill the hidden "company" field get a success reply and no row.
 *
 * The site works with v1 too; only the city question needs v2.
 *
 * ── Updating the live deployment WITHOUT changing its URL ──
 *  1. In the sheet, type "City" in cell D1.
 *  2. Extensions → Apps Script → replace all the code with this file → Save.
 *  3. Deploy → Manage deployments → select the web app → Edit (pencil icon)
 *     → Version: "New version" → Deploy. Authorise if asked.
 *  Choosing "New deployment" instead creates a NEW URL; if that happens,
 *  paste it into js/config.js as scriptUrl.
 *
 * ── First-time setup ──
 *  Same as above, but in step 3 use Deploy → New deployment → Web app,
 *  Execute as: Me, Who has access: Anyone, then copy the /exec URL into js/config.js.
 * ============================================================
 */

var SHEET_NAME = 'Sheet1';   // change if your tab has another name
var VERSION = 2;
var COL = { TIME: 1, NAME: 2, EMAIL: 3, CITY: 4 };
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** GET → how many people are waiting. */
function doGet() {
  try {
    return respond({ ok: true, count: Math.max(0, getSheet().getLastRow() - 1), v: VERSION });
  } catch (err) {
    return respond({ ok: false, count: 0, error: String(err) });
  }
}

/** POST → join (name, email) or save a city (action=city, email, city). */
function doPost(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'city') return respond(saveCity(p));
    return respond(join(p));
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function join(p) {
  if (p.company) return { ok: true, success: true, v: VERSION };   // honeypot

  var name = clean(p.name, 80);
  var email = clean(p.email, 120).toLowerCase();
  if (!name) return { ok: false, error: 'name' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'email' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet();
    var row = findRow(sheet, email);
    var count = Math.max(0, sheet.getLastRow() - 1);
    if (row) {
      return { ok: true, success: true, duplicate: true, position: row - 1, count: count, v: VERSION };
    }
    sheet.appendRow([new Date().toISOString(), plain(name), plain(email), '']);
    var position = sheet.getLastRow() - 1;
    return { ok: true, success: true, duplicate: false, position: position, count: position, v: VERSION };
  } finally {
    lock.releaseLock();
  }
}

function saveCity(p) {
  var email = clean(p.email, 120).toLowerCase();
  var city = clean(p.city, 40);
  if (!EMAIL_RE.test(email) || !city) return { ok: false, error: 'missing' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet();
    var row = findRow(sheet, email);
    if (!row) return { ok: false, error: 'not-found' };
    var cell = sheet.getRange(row, COL.CITY);
    var current = String(cell.getValue() || '').trim();
    if (current) return { ok: true, city: current, unchanged: true, v: VERSION };   // write-once
    cell.setValue(plain(city));
    return { ok: true, city: city, v: VERSION };
  } finally {
    lock.releaseLock();
  }
}

/** Row number (1-based, header is row 1) holding this email, or 0. */
function findRow(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var values = sheet.getRange(2, COL.EMAIL, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return 0;
}

function clean(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Store as text, never as a formula. */
function plain(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
