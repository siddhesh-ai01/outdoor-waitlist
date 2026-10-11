# Outdoor — Claude Code Instructions


## Project Brief

@.claude/docs/site-brief.md

> The brief predates brand v2.1. Where they disagree, **brand v2.1 wins**:
> `C:\Users\Siddhesh\Documents\outdoor-app\docs\Outdoor_Brand_Palette.md`
> (fonts, colours, the orange rule, the dot-matrix system in Part 10, the mascot in Part 11).


## Skills

@.claude/skills/frontend-design/SKILL.md

## Stack

Static HTML, CSS and ES modules, hosted on GitHub Pages (custom domain in `CNAME`).
No build step: what is in the repo is what is served. The waitlist backend is a
Google Apps Script web app writing to a Google Sheet.

## Project Structure

```
outdoor-waitlist/
├── index.html            ← Home: hero field · one app, four jobs · sports · long game · founder's note · join · next: story
├── story.html            ← Our story (was About): opener · five apps fold into one · promises · long game · people · FAQ · say hello
├── about.html            ← Redirect stub to story.html (keeps old links working)
├── waitlist.html         ← Dedicated join page
├── thank-you.html        ← Position, f1-flag mascot, optional city, WhatsApp share
├── privacy.html · terms.html · delete-account.html   ← Legal pages (also the app's store links)
├── 404.html              ← Served by GitHub Pages for any missing path (root-relative URLs only)
├── APPS_SCRIPT.js        ← Waitlist backend, v2 (paste into Apps Script; deploy steps inside)
├── favicon.svg · site.webmanifest · robots.txt · sitemap.xml · CNAME
│
├── css/
│   ├── tokens.css        ← Brand v2.1 tokens; dark default, [data-theme="light"] overrides
│   ├── base.css          ← Fonts, reset, type roles, buttons, glass header, phone dock, forms, phases, footer
│   ├── home.css · story.css · pages.css
│
├── js/                   ← ES modules; each page loads one entry module
│   ├── config.js         ← Apps Script URL, LAUNCH SWITCH (storeUrl), email, socials
│   ├── site.js           ← Every page: theme, header, CTA hand-off, reveals, launch switch, mascots
│   ├── field.js          ← The dot field, ported from the app + the rotating LED mascot silhouette
│   ├── mascot.js         ← SVG mascot player (the app's five clips)
│   ├── intro.js          ← First-visit logo reveal (the app's launch-splash Lottie)
│   ├── waitlist.js       ← Count, join form, thank-you page, city step, share
│   └── home.js · story.js · join.js · thanks.js · notfound.js   ← page entry modules
│
└── assets/
    ├── fonts/            ← WOFF2: DM Sans, Satoshi, Bebas Neue, Space Grotesk, Cormorant Garamond, Dancing Script
    ├── mascot/           ← run · cycle · keepy-uppy · tennis-bounce · f1-flag (from outdoor-app/src/components/mascot)
    ├── lottie/           ← splash-dark.json · splash-light.json (from outdoor-app/assets/splash)
    └── images/           ← icons/ (favicon PNGs, touch icon) · og/outdoor-og.png (share card)
```

## Decisions to keep (founder, 2026-10-10)

- **Hero silhouette = the five mascot clips as an orange LED dot figure**, rotating
  run → cycle → keepy-uppy → tennis-bounce → f1-flag. This deliberately departs from
  the app's mascot.md (which keeps the solid mascot and the dot silhouette apart) — it is
  a website decision, don't "fix" it.
- **Copy frames Outdoor as an all-sports app.** Cricket, football, tennis, F1 and chess
  are "in, more on the way" — never "only five sports", and don't repeat the number.
- **The waitlist count is always shown.**
- **Thank-you asks one optional question: "Where do you play?"** Never ask which sports
  the visitor follows.
- About is called **Story**. Team info stays generic (no named team, no hiring line).
- Dark is the default theme; a visitor's choice is remembered (`localStorage` key `outdoor-theme`).
- Instagram and YouTube stay hidden until they exist (add them to `CONFIG.social`).

## Rules this site follows

- **Fonts:** DM Sans everywhere, plus at most ONE accent family per section — Satoshi
  (hero lines, wordmark), Bebas Neue (numbers), Space Grotesk (chips ≤15px), Cormorant
  Garamond (one quote), Dancing Script (a visitor's own first name only).
- **Orange:** the primary button and the wordmark's O. One orange action per screen —
  the header's Join button stays outlined while the page's own CTA or form is visible
  (`data-page-cta`, `data-cta-zone`). Links are Live Blue; labels are muted.
- **Dot field:** one canvas, one 16px grid (spec.ts values). Dots never move off-grid;
  only opacity and size change. No grain overlays.
- **Keep it sparse:** a fact appears once per page; no unverifiable numbers or claims.
- **Reduced motion:** still frames (run frame 0), no intro, no blinking; pointer glow stays.

## Waitlist backend (APPS_SCRIPT.js v2)

The site reads the script's JSON reply (the POST is a CORS simple request), so it
shows real positions and recognises repeat sign-ups. It works with v1 too; the city
step appears only once v2 is live (its replies carry `v: 2`).

To update the live deployment **without changing its URL**: add `City` in D1 of the
sheet → Extensions → Apps Script → replace the code → Save → Deploy → Manage
deployments → Edit → Version: New version → Deploy. A *new* deployment gets a new URL,
which then goes into `js/config.js`.

**Never send test sign-ups to the real script.** Test with the Apps Script mocked
(e.g. Chrome DevTools Protocol `Fetch.enable` on `*script.google.com*`).

## Still to fill in

- `privacy.html`, `terms.html`, `delete-account.html`: the `[Legal name]`,
  `[Registered address]`, `[City]`, `[Grievance officer name]` and
  `[Developer name on Google Play]` placeholders (marked `TODO(founder)`).
- App screenshots for the home phone frame (Following, News Flash, Venues; dark mode).
  Until then the frame shows stand-ins drawn from the app's onboarding previews.
- Founder photo for the Story page (the avatar shows an initial until then).
- Launch day: set `CONFIG.storeUrl` in `js/config.js`.
