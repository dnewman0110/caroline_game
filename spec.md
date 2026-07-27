# Sparkle & Roar — Toddler Game Spec

## Overview
A browser-based game for a 3-year-old girl named Caroline who loves princesses, unicorns, and dinosaurs, and enjoys drawing. The game is a hub of four simple mini-games, designed for a child who cannot yet read. No fail states, no pressure, no external links — pure open-ended play.

## Target user
- Age: 3 years old
- Cannot read but recognizes letters and her own name; relies entirely on icons, colors, and pictures
- Interaction: tap and simple drag (no complex gestures, no multi-touch, no precision requirements)
- Plays on a phone or tablet touchscreen in a browser

## Tech constraints
- Single self-contained web app: HTML + CSS + JS (vanilla JS or a very lightweight framework is fine — no build step required if possible, to keep deployment trivial)
- No backend, no database, no login, no user accounts
- No network calls, no analytics, no ads, no third-party trackers
- No external links or navigation away from the page
- All state (e.g. current drawing) can live in-memory for the session; persistence across sessions is NOT required (nice-to-have only, see below)
- Must work fully offline once loaded (no CDN dependencies that could fail — bundle any needed libraries locally, or avoid them entirely)
- Target: mobile Safari/Chrome, portrait and landscape both usable, responsive to various phone/tablet screen sizes
- Big tap targets throughout: minimum ~60x60px touch area for any interactive element
- No text required for navigation (icon-only), since the player can't read

## Structure

### Home screen
- Large, colorful icon buttons for each of the 4 mini-games (equal visual weight, no "correct" order)
- Fun idle animation/sparkle effect on the home screen to invite exploration
- A small speaker/mute icon toggle (persists across mini-games)
- No settings, no menus, no text labels required (icons should be self-explanatory to an adult helping, but a 3-year-old will just tap and explore)

### Mini-game 1: Draw & Color
- Freehand drawing canvas (finger-drag drawing)
- 5-6 large color swatches to pick from (bright, saturated colors)
- A few tap-to-stamp stickers (unicorn, dinosaur, crown, rainbow, star) that can be dropped anywhere on the canvas
- A single "clear canvas" button (large, obvious, maybe with a fun animation like a puff of stars) — no confirmation dialog needed, just make it feel light/fun, not punishing
- No undo/redo needed; keep it simple

### Mini-game 2: Hatch a Dino
- A few wobbling eggs displayed on screen
- Tapping an egg triggers a crack animation + reveal of a cute baby dinosaur, with a playful sound effect
- After hatching, the dino does a small idle animation/sound loop
- New eggs can appear (endless/repeatable, no end state, no scoring)
- Variety: rotate through a handful of different baby dinosaur designs so repeat play stays fresh

### Mini-game 3: Dress-Up
- One simple base character (gender-neutral or a simple blank character silhouette) in the center
- A tray of draggable accessories: tiaras, bows, unicorn horns, dinosaur spikes/tails, etc.
- Drag-and-drop accessories onto the character; generous drop-zone tolerance (child doesn't need to be precise)
- No "correct" combinations — mixing dino spikes with a tiara is encouraged and fun
- A gentle shimmer/sparkle effect when an accessory is placed successfully

### Mini-game 4: Star Match
- A few large shapes/outlines displayed (star, moon, gem shapes)
- Matching draggable glowing shapes that the child drags into the outlines
- Very generous "snap into place" drop zones — near enough should count as correct
- No wrong-answer penalty: if dropped elsewhere, the piece just gently floats back, no error sound or negative feedback
- Celebratory animation/sound when a match is made; no scorekeeping, no timer, no losing

## Audio
- Playful background music (light, loopable, non-repetitive-feeling track)
- Distinct, cheerful sound effects per interaction (egg crack, sticker stamp, accessory placement, star match success)
- Global mute toggle, remembered across mini-game switches within the same session
- All audio assets should be small/lightweight and included locally (no external streaming)

## Explicit non-goals
- No scoring, timers, levels, or difficulty progression
- No failure states or negative feedback of any kind
- No ads, in-app purchases, or monetization
- No links to external sites, app stores, or social sharing
- No data collection, accounts, or persistence requirements beyond the current session (unless added later as a nice-to-have)
- No reading/text required to play

## Deployment
- Deploy as a static site via **GitHub Pages**
- Build should be a single HTML file (or a small handful of files: index.html, styles.css, script.js, plus local audio/image assets in an `/assets` folder) to keep the GitHub Pages deploy trivial (push to repo → enable Pages on the repo → live URL)
- No custom domain required, but repo should be structured so one could be added later without changes to the app code
- Add a basic web app manifest (`manifest.json`) + icons so the game can be added to a phone/tablet home screen as an installable-feeling icon (PWA-lite), without needing an app store
- No service worker / offline caching required unless trivial to add — nice-to-have, not a requirement

## Nice-to-haves (optional, only if easy)
- Save the current drawing to local storage so it persists if the browser is closed and reopened
- A subtle "wow" celebratory animation (confetti/sparkles) when switching between mini-games
- Randomized dino/sticker variety so the game doesn't feel identical every session

## Success criteria
A 3-year-old who cannot read can open the page on a phone or tablet, understand what to do purely from visuals, and freely explore all four mini-games without ever hitting an error, a wall of text, a link out, or a "you lose" moment.