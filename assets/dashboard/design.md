# Project Skor+ — Dashboard Redesign Spec

## 1. Overview

Redesign dashboard dari current UI (plain, minimal, light theme) kepada **pixel-art / retro RPG gamification theme** — dark purple/navy space background, pixel-bordered cards, game-style HUD stats, hero character, quest system.

Reference: current UI = phone mockup paling kiri. Target UI = phone mockup tengah ("Project SKOR+").

---

## 2. Typography

| Use case | Font |
|---|---|
| Logo / big headings ("PROJECT SKOR+", XP number "780 XP") | **Pixelify Sans Bold** |
| Tags / labels ("ACTIVE QUEST", badges) | **Press Start 2P** |
| Body copy / descriptions ("Learn about vectors...") | **DM Sans** |

Fallback stack: `"Pixelify Sans", "Press Start 2P", "DM Sans", monospace, sans-serif`

---

## 3. Color & Background

- Base background: dark navy/purple gradient
- Hero background art: **1x pixel-art nebula/space sky** (deep purple, stars, nebula clouds) — used full-bleed behind top section / Open World card
- Card backgrounds: dark indigo/violet with pixel (8-bit) borders
- Accent colors:
  - **Primary blue** — pixel-bordered button (main CTA, e.g. "Open World")
  - **Accent pink/magenta** — pixel-bordered button (secondary CTA, e.g. "Coming Soon", "Edit Quest")
  - **Gold/yellow** — trophy / completed quests
  - **Orange** — streak / fire

---

## 4. Layout Structure

### 4.1 Top Bar
- ☰ Menu icon (left)
- Pixel logo **"SKOR+"** (center) — Pixelify Sans Bold + pixel logo asset
- ⚙ Settings icon (right)

### 4.2 Stats Row (3 cards)
| Card | Icon | Value | Label |
|---|---|---|---|
| Total XP | ⚡ Lightning/XP icon | 780 | TOTAL EXP |
| Streak | 🔥 Fire icon | 7 | DAYS STREAK |
| Completed | 🏆 Trophy icon | 15 | QUESTS COMPLETED |

Style: pixel-bordered rounded card, icon on top, big number (Pixelify Sans Bold), small label under (Press Start 2P, small size).

### 4.3 Active Quest Card
- Badge: "ACTIVE QUEST" (Press Start 2P, small pill)
- ⏳ Hourglass icon + countdown ("3 DAYS LEFT")
- Quest title (e.g. "test")
- Due date row: 📅 calendar icon + date/time
- Button: **[ EDIT QUEST ]** — pink pixel-border button
- Optional: hero character sprite standing beside quest text (idle pose)

### 4.4 Adventure Mode / Open World Card
- Label: "ADVENTURE MODE"
- Title: "OPEN WORLD" + subtext "Pick a hero and explore the map"
- Background: small pixel island/world artwork with pixel castle + hero sprite
- Right side: 🔒 lock badge with "COMING SOON" (pink pixel button/tag, since feature locked)

### 4.5 Continue Learning Section
- Section header "CONTINUE LEARNING.." + "Show All →" link
- Course card (e.g. "VECTOR"):
  - 📖 pixel book/course icon
  - Title + short description (DM Sans)
  - Level badge (e.g. "LEVEL 2")
  - **XP progress bar** (pixel style, filled portion shows %, e.g. 60%)

---

---

## 5. Component Notes for Dev/Designer

- Semua card guna **pixel-border style** (bukan smooth rounded corners biasa) — border patah-patah macam 8-bit game window.
- Icon-icon guna flat pixel-art style, bukan flat modern icon (SF Symbols/Material) yang current UI pakai.
- Progress bar & buttons kena ada sedikit "chunky"/blocky feel — align dengan retro game HUD.
- Layout structure/hierarchy (stats → active quest → adventure mode → continue learning) kekal sama macam current UI, cuma visual language yang tukar kepada pixel/game theme.

---

## 6. Prompt Version (untuk AI design/coding tool)

> Redesign a mobile learning-app dashboard into a pixel-art / retro 8-bit RPG game UI. Dark purple space background with stars/nebula. Use Pixelify Sans Bold for headings and stat numbers, Press Start 2P for small tag labels, DM Sans for body text. All cards use pixel/8-bit borders on dark indigo backgrounds. Include: top bar with pixel logo "SKOR+"; 3 stat cards (XP/lightning, streak/fire, quests completed/trophy); an "Active Quest" card with hourglass countdown, quest title, due date, and a pink pixel-bordered "Edit Quest" button; an "Open World" adventure card with a small pixel island + castle + hero sprite, locked with a "Coming Soon" badge; a "Continue Learning" course card with a pixel book icon, level badge, and a pixel-style XP progress bar. Buttons: primary blue pixel-bordered, secondary pink pixel-bordered.
