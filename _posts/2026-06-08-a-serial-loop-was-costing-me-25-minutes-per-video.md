---
title: "A serial loop was costing me 25 minutes per video"
date: 2026-06-08 11:20:00 +0300
categories: [Pipelines]
tags: [python, concurrency, performance, api]
description: "How a single-threaded generation loop turned a 4-second API call into a 10-second one, and what fixing it actually required."
---

My pipeline generated 149 images in 26 minutes. The model itself returns in about 4 seconds. That accounting does not work: 149 times 4 seconds is under 10 minutes, so roughly 6 seconds per image were going somewhere I could not see.

<!--more-->

## Measure the call, not the loop

The first instinct is to blame the API. Time the call itself before you do that.

```python
import time

latencies = []
for scene in scenes[:20]:
    t0 = time.perf_counter()
    generate_image(scene)
    latencies.append(time.perf_counter() - t0)

latencies.sort()
print(f"mean   {sum(latencies)/len(latencies):.2f}s")
print(f"median {latencies[len(latencies)//2]:.2f}s")
print(f"max    {latencies[-1]:.2f}s")
```

Mean was 4.63s. The API was fine. The extra time was serial round-trip: every request waited for the previous one to finish before the next was even constructed.

## Three phases, not one loop

The naive fix is to wrap the whole loop in a thread pool. That breaks things, because prompt construction mutates scene state and must stay deterministic. Split the work instead.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def generate_all(scenes, concurrency=8):
    # Phase 1 — build prompts serially, in scene order.
    # This mutates scene state, so it must not be parallel.
    for scene in scenes:
        scene.prompt = build_prompt(scene)

    # Phase 2 — render in parallel, results keyed by index.
    results = [None] * len(scenes)
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = {
            pool.submit(render_one, scene): i
            for i, scene in enumerate(scenes)
        }
        for fut in as_completed(futures):
            results[futures[fut]] = fut.result()

    # Phase 3 — fold back in scene order.
    for scene, result in zip(scenes, results):
        scene.image_path = result
```

Indexing the futures dictionary is the whole trick. Completion order is shuffled, but `results[i]` always belongs to `scenes[i]`, so filenames, audit logs and downstream ordering are unaffected.

## Prove the ordering holds

Do not take it on faith. Inject random latency so completion order genuinely differs from submission order, then compare against the serial run.

```python
import random

def render_one(scene):
    time.sleep(random.uniform(1.0, 8.0))   # jitter, test only
    return f"IMG_{scene.index:04d}.png"

serial   = [render_one(s) for s in scenes]
parallel = generate_all(scenes, concurrency=8)

assert serial == parallel, "ordering broke under concurrency"
```

## The result

Twenty scenes, concurrency 8: 13.0 seconds wall clock against 4.63s mean per call. That is 2.5 waves of eight, which is exactly what the pool math predicts — throughput is now bounded by API latency and pool size and nothing else.

Extrapolated to the full set, 26 minutes became roughly 97 seconds. The 6 seconds per image I could not account for turned out to be serial waiting, and the pool absorbed all of it.

Retry policy matters once you are parallel. Retry only transient classes — 408, 409, 425, 429 and 5xx — with exponential backoff and jitter, and honour `Retry-After`. Return immediately on a permanent failure so model fallback happens without burning retries first.
