## Reference Websites

- [Fourmula](https://fourmula.ai/) — Take the reference for sticky scroll animation style from this website. And also the dot matrix/particle grid style animation Is present in this website. Take its reference. 

# Outdoor — Website Brief

## Core Requirements

* **Mobile-first design** — majority of audience will access via phone
* **Accent colour** — Stadium Orange `#FF4E00`- Use this color for highlighting important stuff, This is the main brand color. don't use it everywhere.
* **Theme toggle** — dark/light mode switch
* **Total pages** — 3 [If you consider adding more pages, suggest me accordingly]

\---

## Brand Palette

### Typography
- **Display:** FK Grotesk Black
- **Body:** FK Grotesk Regular
- **Label:** Overline · 10px uppercase

### Dark Mode

**Surfaces & Structure**
- Pitch Black `#0A0A0A` — Background
- Deep Black `#141414` — Nested layers / inputs
- Surface `#1C1C1C` — Cards & modals
- Hover State `#252525` — Interactive hover
- Border `#1E1E1E` — Dividers & rules

**Text Hierarchy**
- Off-White `#F2EDC8` — Headings & primary
- Muted `#808080` — Body text
- Hint `#444444` — Captions & meta

### Light Mode

**Surfaces & Structure**
- Warm Cream `#F5F0E8` — Background
- Pure White `#FFFFFF` — Cards & modals
- Warm Surface `#EDE7DC` — Nested / inputs
- Light Border `#E0D4CE` — Dividers & rules

**Text Hierarchy**
- Pitch Black `#0A0A2A` — Headings & primary
- Dark Text `#333333` — Body copy
- Muted `#808080` — Secondary text
- Hint Light `#BBBBBB` — Captions & meta

### Shared Semantic & Accent Colors (Both Modes)
- Stadium Orange `#FF4E00` — Accent / Live / CTA
- Match Green `#00C27A` — Win / Success
- Loss Red `#FF3B3B` — Loss / Error
- Live Blue `#1EAEFF` — Upcoming / Stats
- Trophy Gold `#FFB300` — Featured / Rank
- Orange Tint `#FF4E00` at 10% opacity — Badge bg overlay
- Green Tint `#00C27A` at 10% opacity — Badge bg
- Blue Tint `#1EAEFF` at 10% opacity — Badge bg
\---

## Pages Overview

|Page|Purpose|
|-|-|
|Main / Landing|Hero, features, phases, waitlist form|
|Join the Waitlist|Dedicated form page|
|About|Company \& team info|

\---

## Main Page

### Header

* Logo / Brand name
* "Join the Waitlist" CTA button
* Dark/Light mode toggle
* "About" navigation link

\---

### Section 1 — Hero

**Layout:** Text on the left · Animation on the right

**Copy:**

```
Outdoor
The complete sports ecosystem India forgot to build, until now
```

**Animation — Dot Matrix / LED Matrix / Particle Grid:**

* Morphing display that cycles through icon shapes
* Suggested icons: Following, Venue, Football, Handshake
* *(Icons to be finalised and added iteratively)*

\---

### Section 2 — Value Proposition

**Copy:**

```
Forget sports as a dedicated task.
Let us handle it all.
```

**Animation:**

* Placeholder for custom animation (not yet ready)
* Store asset in `/plays` folder; integrate once animation is delivered

\---


### Section 3 — App Features

**Layout:** Sticky scroll sequence — scroll-driven card stack (4 cards)

|#|Feature|Description|
|-|-|-|
|1|**Following**|Follow all your favourite sports with no more app hopping|
|2|**Booking**|Manage all venue bookings in one place|
|3|**Co-playing**|Find teams and players for your game|
|4|**Media**|High-quality, premium content — no clickbait|

\---

### Section 4 — Outdoor's Phases (Long-Term Vision)

**Layout:** Phases animation — three sequential stages

```
Community  →  Infrastructure  →  Sports Deep-Tech
```

*(Use an animated timeline or phase progression component)*

\---

### Section 5 — Waitlist Form

* Embedded waitlist sign-up form
* Connected to Google Sheets via some lean workflow
* Fields: **Name**, **Email**, **Submit button**
* *(Refer to the dedicated Waitlist page for full form spec)*

\---

### Section 6 — Footer

* About section / short blurb
* Social media links — placeholders for:

  * LinkedIn
  * Instagram
  * YouTube

\---

## Join the Waitlist Page

* Reuse existing page + Google Sheets integration workflow
* **Keep fields:** Name, Email, Submit
* Design should complement the main page aesthetic
* https://github.com/siddhesh-ai01/outdoor-waitlist.git

Refer to this repo. I had created this for a simple waitlist page. Only refer to the waitlist page workflow from this repo and not the style or text. In this repo, the form was successfully connected with the Google Sheets, and it also counted the number of entries from the Google Sheets. Whenever a new entry was done, the number was updated on the UI side. Refer to this mechanism from this repo. 

\--

## About Page

* Layout only — design to be decided later
* Use content placeholders throughout
* Structure and sections to be determined by designer/developer

> `\[PLACEHOLDER — full About page content to be added later]`

\---


