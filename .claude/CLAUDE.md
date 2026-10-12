# Outdoor — Claude Code Instructions


## Project Brief

@.claude/docs/site-brief.md

> The brief predates everything below. The site is now a build of the founder's
> **Claude Design prototype "Outdoor Website v2"** (project `62e6fc0e-4362-4e77-b666-2bbc08d0c68a`,
> file `Outdoor Website v2.dc.html`; read it with DesignSync after `/design-login`).
> Where the prototype and brand v2.1 disagree, **the prototype wins for the website**
> (founder, 2026-10-11). Brand v2.1 still covers everything the prototype doesn't:
> `C:\Users\Siddhesh\Documents\outdoor-app\docs\Outdoor_Brand_Palette.md`.


## Skills

@.claude/skills/frontend-design/SKILL.md

## Stack

Static HTML, CSS and ES modules, hosted on GitHub Pages (custom domain in `CNAME`).
No build step: what is in the repo is what is served. No third-party requests except
the Apps Script. The waitlist backend is a Google Apps Script web app writing to a Google Sheet.

## Project Structure

```
outdoor-waitlist/
├── index.html            ← Home: LED board hero · ticker · manifesto · four quarters · squad · Lights out · Pune map · Be first in · next
├── story.html            ← Our story: opener (orbit) · half-time talk · red cards · three phases · Ask the ref (FAQ) · next
├── waitlist.html         ← The waitlist pass: form + live card; joins in place (stamp, confetti, share)
├── 404.html              ← VAR "Offside." error page; GitHub Pages serves it at any missing path (root-relative URLs only). Never linked.
├── privacy.html · terms.html · delete-account.html   ← Legal pages (also the app's store links)
├── about.html · thank-you.html   ← Redirect stubs (→ story.html, → waitlist.html)
├── APPS_SCRIPT.js        ← Waitlist backend, v1 — the deployed one (setup steps inside)
├── favicon.svg · site.webmanifest · robots.txt · sitemap.xml · CNAME
│
├── css/
│   ├── tokens.css        ← Design-system tokens from the prototype; dark on :root, [data-theme="light"] overrides
│   ├── base.css          ← Fonts, reset, glass header, footer, buttons, field, reveals, cursor, page transition
│   ├── home.css · story.css · pages.css (pass · 404 · legal)
│
├── js/                   ← ES modules; each page loads one entry module
│   ├── config.js         ← Apps Script URL, LAUNCH SWITCH (storeUrl), email, socials
│   ├── site.js           ← Every page: theme, field, header clock + capsule, footer tagline, launch switch
│   ├── motion.js         ← One scroll frame loop, [data-rv] reveals, count-up, magnetic, tilt, cursor ring
│   ├── transition.js     ← "Lanes" page transition across real pages (sessionStorage flag + <head> class)
│   ├── field.js          ← The app's dot field, fixed to the screen
│   ├── fx.js             ← LED board, squad huddles, confetti (ported from the prototype's outdoor-fx.js)
│   ├── intro.js          ← First-visit "KICK-OFF IN 3·2·1·GO" countdown (Home only)
│   ├── india.js          ← GENERATED: India's official outline + city points for the map
│   ├── waitlist.js       ← Apps Script client: count + join
│   └── home.js · story.js · join.js · notfound.js · legal.js   ← page entry modules
│
└── assets/
    ├── fonts/            ← WOFF2: DM Sans, Satoshi, Bebas Neue, Space Grotesk, Cormorant Garamond (+ Medium Italic), Dancing Script
    └── images/           ← icons/ (favicon PNGs, touch icon) · og/outdoor-og.png (share card)
```

## Decisions to keep (founder, 2026-10-11)

- **Build the prototype as designed.** Where it bends brand v2.1, it stays bent: the header
  Join is always orange; the Story headline is Satoshi with "people." in italic Cormorant;
  the Story orbit dot is orange; the footer tagline is Dancing Script; eyebrows are Space
  Grotesk and numbers Bebas Neue alongside the section's other families.
- **No mascot on the site.** The LED stadium board replaced the mascot hero (this supersedes
  the 2026-10-10 "LED mascot silhouette" decision).
- **No city question, anywhere.** The Apps Script stays at v1 and the founder won't redeploy it.
  The pass card's third field is SPORTS · ALL, not a city.
- **Pune launches first** ("First whistle in Pune"). The map must use India's official outline
  (Natural Earth admin-0, India point of view, in `js/india.js`) — never a world-atlas outline,
  which drops PoK and Aksai Chin.
- **Claims:** free to use, squad planning + chat, and splitting a booking are true at launch.
  Following *local leagues* is not — don't claim it (no Sunday-league examples).
- **The prototype's review lines are not site copy** (2026-10-12): hints that narrate its own
  interactions ("Hover the board", "Scroll, and watch the city…", "Your waitlist card fills in
  as you type", "Half-time talk below") and the footer's "Lost? Try the 404" link were removed —
  don't bring them back. Real instructions stay ("Tap to start", "Tap to skip").
- **Copy frames Outdoor as an all-sports app**; never "only five sports".
- The waitlist count shows on the Home hero, from the script; the line stays hidden if it can't load.
- About is called **Story**. No named team section.
- Dark is the default theme; a visitor's choice is remembered (`localStorage` key `outdoor-theme`).
- Instagram and YouTube stay hidden until they exist (add them to `CONFIG.social`).

## How the site is built

- **Fonts by role:** DM Sans (body, section heads, wordmark), Satoshi (hero lines), Bebas Neue
  (numbers, the LED board), Space Grotesk (eyebrows, chips, labels ≤12px), Cormorant Garamond
  (editorial accents), Dancing Script (footer tagline and the visitor's own first name).
- **Dot field:** one canvas fixed to the screen (`field.js`, the app's spec values). Solid
  sections (`background: var(--background)`) cover it; heroes are see-through and carry
  `data-field-zone`, and the blink loop only runs while one is on screen.
- **Motion:** `[data-rv="n"]` reveals (80 ms steps, `data-rvy` rise), the lanes page transition,
  the first-visit countdown, cursor ring + magnetic buttons + tilt (fine pointers only). All of it
  is off under reduced motion, and content is visible without JS (CSS failsafes).
- **Phones:** one breakpoint at 860px (as in the prototype). Check 320, 360, 390, 768 and 1024+,
  in both themes; no sideways scroll.
- **Keep it sparse:** a fact appears once per page; no unverifiable numbers or claims.
- **Class-name traps:** `<html>` carries state classes (`js`, `intro`, `nav-in`, `pt-cover`,
  `pt-out`, `has-cursor`, `rv-ready`, `is-launched`) — never give an element one of those names
  (`.intro` once matched `<html>` and blanked the page). Generic modifiers collide too: `.next`
  is the "Next up" card, so the timeline uses `.is-next`.

## Waitlist backend (APPS_SCRIPT.js v1)

The repo holds the deployed script. GET returns `{count}`; POST (a CORS simple request)
returns `{success, count}` or `{success, duplicate: true, count}`. A new sign-up's position
is `count`; a repeat has no position. `js/waitlist.js` would also read a newer script's
`{ok, position, duplicate}`.

**Never send test sign-ups to the real script.** Test with it mocked (Chrome DevTools
Protocol `Fetch.enable` on `*script.google.com*`, answering with the shapes above).

## Still to fill in

- `privacy.html`, `terms.html`, `delete-account.html`: the `[Legal name]`,
  `[Registered address]`, `[City]`, `[Grievance officer name]` and
  `[Developer name on Google Play]` placeholders (marked `TODO(founder)`).
- Launch day: set `CONFIG.storeUrl` in `js/config.js` (every Join CTA, the ring text and the
  pass page switch to "Get the app").
