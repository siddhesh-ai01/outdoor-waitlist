/* ==========================================================
   OUTDOOR — Site configuration
   The one file to touch for the waitlist backend and launch day.
   ========================================================== */

export const CONFIG = {
  /* Google Apps Script web app (see APPS_SCRIPT.js). Redeploying a NEW VERSION
     of the same deployment keeps this URL; a brand-new deployment changes it. */
  scriptUrl: 'https://script.google.com/macros/s/AKfycbzhJye9SV5OThRyqiYKhGPPcFb_V1doSXBs83ONe2yj2MIEzHbee5bIiUDg8i1YrzMG/exec',

  /* Launch-day switch. Paste the store link (Play Store, or one smart link) and
     every "Join the waitlist" becomes "Get the app", forms give way to the
     download block, and the thank-you page stops being reachable from the site. */
  storeUrl: '',

  siteUrl: 'https://www.theoutdoor.in/',
  email: 'team.outdoor.in@gmail.com',

  /* Socials with a real page. Instagram and YouTube stay hidden until they exist. */
  social: {
    linkedin: 'https://www.linkedin.com/company/theoutdoor/',
  },
};
