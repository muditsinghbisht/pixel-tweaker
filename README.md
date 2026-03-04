# PIXL — Pixel Manipulation Studio

A lightweight, browser-based image editor that runs entirely client-side. No uploads, no servers, no tracking — just drag, drop, and tweak.

![License](https://img.shields.io/badge/license-MIT-green)
![Built with](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow)
![Made with Claude](https://img.shields.io/badge/made%20with-Claude%20AI-blueviolet)

---

## Features

- **Image Adjustments** — Brightness, contrast, saturation, exposure, gamma
- **RGB Channel Control** — Independent red, green, and blue channel shifting
- **Filters** — Grayscale, sepia, invert, posterize, pixelate, vignette
- **Transform** — Rotate 90° (CW/CCW), flip horizontal/vertical
- **Zoom** — Zoom in/out with fit-to-screen support
- **Pixel Inspector** — Hover over any pixel to see its RGB, HEX, HSL, and alpha values in real time
- **Export** — Download the edited image as PNG
- **Drag & Drop** — Drop any PNG, JPG, WEBP, or GIF to get started

---

## Usage

No installation needed. Just open `index.html` in a browser.

```
git clone https://github.com/muditsinghbisht/pixel-tweaker.git
cd pixel-tweaker
open index.html
```

Or drop `index.html`, `app.js`, and `styles.css` into any static file server.

---

## How It Works

All processing is done directly on an HTML5 `<canvas>` element using raw pixel manipulation via `ImageData`. No libraries, no frameworks — just the Canvas 2D API.

Each adjustment pass reads from the original `ImageData` so edits are always non-destructive until you export.

---

## Tech Stack

- HTML5 Canvas API
- Vanilla JavaScript (ES6+)
- CSS custom properties
- Google Fonts (Space Mono + Syne)

---

## Made with Claude

This project was designed and built with the assistance of **[Claude](https://claude.ai)** by Anthropic — an AI assistant that helped architect the pixel processing pipeline, UI layout, and filter implementations.

> Claude is Anthropic's AI assistant, capable of helping with software design, code generation, debugging, and more.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
