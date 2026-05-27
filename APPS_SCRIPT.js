/**
 * ============================================================
 * OUTDOOR — Google Apps Script (Waitlist Backend)
 * ============================================================
 *
 * HOW TO SET THIS UP (one-time, takes ~5 minutes):
 *
 * 1. Create a new Google Sheet (give it any name, e.g. "Outdoor Waitlist")
 *
 * 2. In row 1, add headers in columns A, B, C:
 *      A1: Timestamp    B1: Name    C1: Email
 *
 * 3. Open Extensions → Apps Script
 *
 * 4. Delete all existing code in the editor and paste this entire file.
 *
 * 5. Click "Save project" (floppy disk icon or Ctrl+S).
 *
 * 6. Click "Deploy" → "New deployment"
 *      - Type:              Web app
 *      - Execute as:        Me
 *      - Who has access:    Anyone
 *    Click "Deploy". Authorise the app when prompted.
 *
 * 7. Copy the "Web app URL" — it looks like:
 *      https://script.google.com/macros/s/XXXXXXXXXX/exec
 *
 * 8. Open js/waitlist.js and replace:
 *      const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
 *    with your actual URL.
 *
 * That's it — the form is now live and submits go straight to the sheet.
 * Every new entry is a new row; the count auto-updates on the UI.
 * ============================================================
 */

// ─── CONFIG ────────────────────────────────────────────────
// If your sheet tab has a custom name, change this to match.
var SHEET_NAME = 'Sheet1';
// ───────────────────────────────────────────────────────────

/**
 * Handle form submissions (POST from the website).
 * Receives: name, email as URL-encoded form body.
 */
function doPost(e) {
  try {
    var sheet = getSheet();
    var name  = (e.parameter.name  || '').trim();
    var email = (e.parameter.email || '').trim();

    if (!email) {
      return respond({ success: false, error: 'Email is required.' });
    }

    // Check for duplicate email
    var data  = sheet.getDataRange().getValues();
    var emails = data.slice(1).map(function (row) { return (row[2] || '').toLowerCase(); });
    if (emails.indexOf(email.toLowerCase()) !== -1) {
      var count = Math.max(0, sheet.getLastRow() - 1);
      return respond({ success: true, duplicate: true, count: count });
    }

    var timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, name, email]);

    var count = Math.max(0, sheet.getLastRow() - 1);
    return respond({ success: true, count: count });

  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

/**
 * Return the current waitlist count (GET request from the UI).
 */
function doGet(e) {
  try {
    var sheet = getSheet();
    var count = Math.max(0, sheet.getLastRow() - 1);
    return respond({ count: count });
  } catch (err) {
    return respond({ count: 0, error: err.message });
  }
}

/** Helper: get the target sheet */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  return sheet;
}

/** Helper: JSON response with CORS headers */
function respond(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
