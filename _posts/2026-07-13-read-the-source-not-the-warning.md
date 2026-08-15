---
title: "Read the source, not the warning"
date: 2026-07-13 15:20:00 +0300
categories: [Debugging]
tags: [debugging, node, ffmpeg, video, methodology]
description: "A warning told me to change a setting. Changing it did nothing. Twenty minutes in node_modules explained why, and saved a week of chasing it."
---

My renderer printed this on every run:

```
Hardware accelerated encoding disabled - "crf" option is not
supported with hardware acceleration
```

The obvious reading: my CRF value is too aggressive, lower it and hardware encoding comes back. I built a task around that assumption and wrote it into project documentation. Both were wrong.

<!--more-->

## Twenty minutes in node_modules

Before spending a day on it, I opened the file that emits the warning.

```javascript
// @remotion/renderer/dist/get-codec-name.js
if (crf !== null && typeof crf !== 'undefined') {
    return 'crf';        // -> disables hardware acceleration
}
```

It is not the value. Specifying `crf` **at all** trips this branch. Any number, including the "safe" one I was about to switch to.

Then, a few lines down:

```javascript
if (codec === 'h264') {
    if (preferred && process.platform === 'darwin' && !unsupportedQualityOption) {
        return { encoderName: 'h264_videotoolbox', hardwareAccelerated: true };
    }
    warnAboutDisabledHardwareAcceleration();
    return { encoderName: 'libx264', hardwareAccelerated: false };
}
```

The only h264 hardware path is Apple VideoToolbox. On Linux and Windows it returns `libx264` unconditionally. Dropping `crf` entirely would silence the warning and change nothing, and my deployment target has no GPU regardless.

Three assumptions, all wrong, all disproved by reading forty lines.

## Confirm empirically anyway

```
crf 10:  exit=0  elapsed=95s  size=53,458,834  warning: YES
crf 18:  exit=0  elapsed=94s  size=27,976,310  warning: YES
```

The warning stays either way. But the change was still worth making for a reason unrelated to the warning: 1.91x smaller files at identical render time. I kept it, and documented that hardware encoding is unavailable on this platform so nobody chases it again.

## Why this generalises

Warning text is written by someone describing a condition, not prescribing your fix. It tells you what the code observed. It does not tell you what branch you are in, what platform gates apply, or whether the suggested remedy exists in your environment.

The tools are unglamorous and fast:

```bash
grep -rn "hardware acceleration" node_modules/@remotion/renderer/dist/ | head
python -c "import somelib, os; print(os.path.dirname(somelib.__file__))"
```

Installed source is right there. It is the actual behaviour rather than a description of it, it matches your exact version rather than the docs for a different one, and reading it usually takes less time than one wrong experiment.

## The part that stung

I had written the wrong conclusion into a project brief, where it shaped a task list. A confident wrong note in shared documentation costs more than no note, because it stops other people from checking.

The fix was to correct it in place and add a line saying the premise had been tested and disproved — so the next person reads the finding rather than repeating the investigation.
