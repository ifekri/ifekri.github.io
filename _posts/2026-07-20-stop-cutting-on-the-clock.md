---
title: "Stop cutting on the clock"
date: 2026-07-20 12:15:00 +0300
categories: [Pipelines]
tags: [video, scene-planning, cost-optimisation, python]
description: "A fixed interval is the easiest way to segment a video and the most expensive. Word-level timings you already have can do it better."
---

My scene planner divided total duration by ten and generated one image per slot. A 25-minute video produced 149 images. Simple, predictable, and wrong on both axes: it cost more than it needed to, and it cut in the middle of sentences.

<!--more-->

## The information was already there

The transcription step produced 416 subtitle segments with word-level timings. Those are semantic boundaries — real ones, derived from where the speaker actually paused. The planner ignored all of them and used a stopwatch instead.

```python
# What it did
scene_count = int(total_duration / 10)
scenes = [
    Scene(start=i * 10, end=(i + 1) * 10)
    for i in range(scene_count)
]
```

Every boundary here is arbitrary. Some land mid-clause. Some split a sentence whose two halves need the same image.

## Group on meaning, bounded by time

Keep the duration bounds — they exist so no image sits on screen too long — but let content decide where inside them the cut falls.

```python
def plan_scenes(segments, min_len=10.0, max_len=15.0):
    scenes, current = [], []

    for seg in segments:
        current.append(seg)
        span = current[-1].end - current[0].start

        if span < min_len:
            continue

        # Past the minimum: cut at a real boundary, or at the ceiling
        if seg.ends_sentence or span >= max_len:
            scenes.append(Scene(
                start=current[0].start,
                end=current[-1].end,
                text=" ".join(s.text for s in current),
            ))
            current = []

    if current:
        scenes.append(Scene(
            start=current[0].start,
            end=current[-1].end,
            text=" ".join(s.text for s in current),
        ))
    return scenes
```

The scene now carries its own text, which means the prompt for its image can be built from what is actually being said during it — not from whatever words happened to fall inside a ten-second window.

## What it costs

At my measured rate the arithmetic is blunt:

| | images | image spend |
|---|---|---|
| fixed 10s | 149 | $5.07 |
| semantic, 10-15s | ~60 | $2.04 |

Image generation was 96% of my per-video cost. Cutting image count by 60% cuts the whole unit cost by nearly the same proportion. No other optimisation in the pipeline comes close.

## The trap

Longer scenes with static images look worse, not better. A still frame held for fifteen seconds reads as a stall. You have to spend some of what you saved on motion.

```jsx
const progress = frame / durationInFrames;
const scale = interpolate(progress, [0, 1], [1.0, 1.08]);
const x = interpolate(progress, [0, 1], [0, -20]);

<img style={{ transform: `scale(${scale}) translateX(${x}px)` }} />
```

Slow, restrained, and varied in direction between scenes so it does not become its own pattern. Roughly 8% scale over the full duration is enough — anything more reads as an effect rather than as life.

Ship the two changes together. Semantic grouping without motion makes the output cheaper and worse, which is the wrong trade to make on the thing you sell.
