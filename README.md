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

- Art assets sourced from [Kenney.nl](https://kenney.nl) (CC0 / public domain).
- Icon/sticker art sourced from [OpenMoji](https://openmoji.org) (CC BY-SA 4.0).
- All sound effects and music are synthesized in-browser via the Web Audio API — no audio files are bundled.
