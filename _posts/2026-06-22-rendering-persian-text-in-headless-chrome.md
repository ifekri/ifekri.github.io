---
title: "Rendering Persian text in headless Chrome"
date: 2026-06-22 16:10:00 +0300
categories: [Rendering]
tags: [docker, fonts, rtl, chrome, i18n]
description: "Why your Arabic and Persian subtitles render as empty boxes inside a container, and the four things that actually fix it."
---

Your renderer works locally. You containerise it, run the same job, and every line of Persian is a row of empty rectangles. Nothing errors. The pipeline reports success.

<!--more-->

## Slim images ship no fonts

Headless Chrome does not embed fonts. It asks the system, and a slim base image has almost nothing to give it. Latin text falls back to something passable; Arabic script falls back to nothing, and you get tofu.

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
        fonts-noto-core \
        fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Ship your own fonts alongside the system ones
COPY assets/fonts/ /usr/share/fonts/truetype/custom/
RUN fc-cache -fv
```

`fc-cache -fv` is not optional. Copying font files without rebuilding the cache leaves them invisible to fontconfig, which is a failure that looks identical to not having copied them at all.

## Verify inside the image, not after the render

```bash
docker run --rm my-renderer fc-list :lang=fa | head
docker run --rm my-renderer fc-match "Vazirmatn"
```

If `fc-list :lang=fa` prints nothing, no amount of CSS will help.

## Shaping is separate from availability

Having the font is necessary, not sufficient. Arabic script is cursive: letters change shape based on position, and pairs form ligatures. If your text arrives pre-shaped from a Python step, the browser will shape it a second time and you get mangled output.

```python
# Only do this if the renderer will NOT shape the text itself.
# Chrome shapes correctly on its own — do not pre-shape for it.
import arabic_reshaper
from bidi.algorithm import get_display

shaped = get_display(arabic_reshaper.reshape(text))
```

Rule of thumb: pre-shape for PIL and ffmpeg's `drawtext`. Never pre-shape for a browser.

## Direction is a property of the container, not the string

```css
.subtitle {
  direction: rtl;
  unicode-bidi: plaintext;
  text-align: center;
  font-family: "Vazirmatn", "Noto Sans Arabic", sans-serif;
}
```

`unicode-bidi: plaintext` is the one most people miss. It makes each paragraph pick its own direction from its first strong character, which is what you want for mixed content — a Persian sentence containing an English product name renders correctly without manual markup.

## Test with the ugly case

Do not test with a clean Persian sentence. Test with the one that breaks things:

```
سرعت رندر از ۲۶ دقیقه به ۹۷ ثانیه رسید (concurrency=8)
```

Persian text, Eastern Arabic numerals, a Latin word, and parentheses — which flip direction. If that line renders correctly at the right baseline with correct bracket orientation, your pipeline handles RTL. Most do not, which is exactly why it is worth getting right.
