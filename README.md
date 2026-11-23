<div align="center">

<img src="assets/img/favicon.svg" width="72" alt="Motif logo" />

# Motif

A molecular-biology workbench for you and your AI agent.

[Live site](https://jvogan.github.io/motif-site/) ·
[Source repository](https://github.com/jvogan/motif) ·
[Capability reference](https://github.com/jvogan/motif/blob/main/docs/CAPABILITIES.md)

</div>

---

Motif runs in your browser as one HTML file, and Codex or Claude Science can
open it for you with your records loaded. This repository holds the landing
page at <https://jvogan.github.io/motif-site/>. The workbench source, the
connectors, and the setup guides are in
[jvogan/motif](https://github.com/jvogan/motif).

## Run the page locally

The page is static HTML and CSS, plus `js/site.js` for the Copy buttons,
the example tabs, and the scroll reveal. It has no build step. Without
JavaScript the Copy buttons stay hidden, the prompt text stays selectable,
every example shows with its request and screenshot, and the load and
scroll animations do not run. All motion stops when the reader's system
asks for reduced motion.

```bash
python3 -m http.server 4178
```

Open <http://localhost:4178>.

## Files

| Path | Contents |
| --- | --- |
| `index.html` | The page, its meta tags, and its JSON-LD |
| `css/styles.css` | All styles |
| `js/site.js` | Copy buttons, example tabs, and scroll reveal |
| `assets/shots/` | Workbench screenshots in WebP: the hero at 2000x1250, its phone crop at 780x1060, the examples at 2000x938 |
| `assets/img/og.png` | Social preview image, 1280x640 |
| `assets/img/favicon.svg` | Logo mark |
| `assets/mascot/crab.webp` | Footer mascot |
| `assets/video/` | Empty until the demo video is added |

## Publish the demo video

`index.html` holds a demo-video section, `<section id="demo">`, inside
`<template id="demo-slot">`, so the browser neither shows it nor requests its
files. The HTML comment directly above the template lists the steps to
publish the video.

`python3 -m http.server` answers a Range request with the whole file, so the
video plays locally but does not seek. GitHub Pages answers Range requests
with `206 Partial Content`, and seeking works there.

## License

[MIT](LICENSE).

---

<sub>Motif is an independent open-source project. It is not affiliated with, sponsored by, or endorsed by Anthropic or OpenAI. Claude, Claude Science, and Codex are trademarks of their respective owners. Motif is a research and design tool, not a clinical or diagnostic device.</sub>
