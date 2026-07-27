# Sparkle & Roar

A browser-based toddler game hub with four mini-games: Draw & Color, Hatch a Dino, Dress-Up, and Star Match. No reading required, no scoring, no failure states — pure open-ended play. See [spec.md](spec.md) for the full design spec.

## Running locally

This project has no build step, but it uses native ES modules (`<script type="module">`), which browsers block from loading over `file://`. Serve the folder with any static file server, for example:

```sh
npx serve .
# or
python -m http.server 8000
```

Then open the printed local URL in a browser.

## Deployment

Static site, deployable as-is via GitHub Pages (Settings → Pages → deploy from the `main` branch root).

## Credits

- Sticker/icon art (`assets/img/stickers/`: unicorn, T-Rex, crown, rainbow, star, glowing star, bow, sparkles, gem) is from [OpenMoji](https://openmoji.org), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- The baby dinosaurs, egg, character silhouette, dress-up accessories (horn/spikes/tail), Star Match shapes, and app icon are hand-coded SVG/Canvas art original to this project (no suitable CC0 dinosaur pack was found on Kenney.nl after a thorough search, so these were hand-drawn instead of sourced).
- All sound effects and music are synthesized live in-browser via the Web Audio API — no audio files are bundled.
- Spoken instructions use the browser's built-in Web Speech API (`speechSynthesis`), restricted to voices flagged `localService` so narration never makes a network call. There's no real child's-voice option available this way — it picks the most female/youthful-sounding local voice and raises its pitch as an approximation. Voice availability and quality vary by device/OS, and browsers with no local voices installed will simply play no narration (never a network fallback).
