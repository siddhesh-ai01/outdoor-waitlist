# Outdoor — Claude Code Instructions


## Project Brief

@.claude/docs/site-brief.md


## Skills

@.claude/skills/frontend-design/SKILL.md

## Stack

- [I am planning to host this website on github pages and it supports HTML, CSS, Javascript. So, use a stack, according to you, which would be able to be hosted on GitHub Pages.]

## Project Structure

```
outdoor-website/
├── index.html            ← Main landing page (hero, features, phases, waitlist, footer)
├── waitlist.html         ← Dedicated waitlist page (split-panel layout)
├── about.html            ← About page (placeholder content, fill in later)
├── APPS_SCRIPT.js        ← Paste into Google Apps Script to enable the waitlist backend
│
├── css/
│   ├── tokens.css        ← All design tokens (colors, fonts, spacing, radii, easing)
│   ├── global.css        ← Reset, @font-face, base components (header, footer, buttons)
│   └── animations.css    ← Section-specific styles + keyframes (hero, features, phases, etc.)
│
├── js/
│   ├── theme.js          ← Dark/light toggle, logo swap, scroll-reveal, header frost
│   ├── matrix.js         ← LED dot-matrix morphing animation (hero canvas)
│   ├── sticky-scroll.js  ← Features sticky-scroll + phase reveal (IntersectionObserver)
│   └── waitlist.js       ← Form submission → Apps Script, live count fetching
│
├── plays/
│   └── placeholder.js    ← Slot for the custom Section 2 animation (add your file here)
│
└── assets/
    ├── fonts/            ← FK Grotesk .otf files (self-hosted)
    └── images/
        └── logos/        ← logo-dark.png, logo-light.png, full name logo.png
```

## Waitlist Setup
1. Create a Google Sheet, add headers: `Timestamp | Name | Email`
2. Extensions → Apps Script → paste `APPS_SCRIPT.js` → Deploy as Web App
3. Copy the Web App URL → paste into `js/waitlist.js` as `SCRIPT_URL`

## Notes
- Default theme: **dark**. Logo swaps automatically on theme toggle.
- FK Grotesk Trial fonts are self-hosted from `assets/fonts/`.
- Section 2 animation placeholder is in `plays/` — swap in the real file when ready.
- About page content is all placeholder — fill in copy and team details when ready.



