---
title: "Content hashing for expensive stages"
date: 2026-08-14 10:00:00 +0300
categories: [Pipelines]
tags: [caching, idempotency, architecture, python]
description: "When a stage costs real money, rerunning it after a downstream failure is a bill you should not be paying twice."
---

A late-stage failure in my pipeline meant rerunning from the top, which meant paying for image generation again. The images had not changed. Nothing about their inputs had changed. I was buying identical output twice because the pipeline had no way to know it was identical.

<!--more-->

## Key on inputs, not on filenames

The usual instinct is to check whether the output file exists and skip if so. That fails in the direction that hurts: a stale file with the right name silently satisfies the check and you ship the wrong content.

Hash what went in instead.

```python
import hashlib, json

def stage_key(stage_name: str, inputs: dict) -> str:
    payload = json.dumps(inputs, sort_keys=True, ensure_ascii=False)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return f"{stage_name}:{digest}"
```

`sort_keys=True` matters. Without it, two identical dicts serialise differently depending on insertion order and you get cache misses that look like cache bugs.

## Include everything that changes the output

This is where it goes wrong. Miss a field and you serve stale results after a change that should have invalidated them.

```python
key = stage_key("image", {
    "prompt": scene.prompt,
    "model": model_id,
    "style_preset": config.style,
    "aspect_ratio": config.aspect_ratio,
    "seed": scene.seed,
    "prompt_template_version": TEMPLATE_VERSION,   # bump when you edit it
})
```

`prompt_template_version` is the one people forget. Edit the base template, and every prompt changes even though no scene did. Without a version in the key, the whole library goes stale invisibly.

## Store the result next to the key

```python
def cached(key: str, produce, store: Path):
    marker = store / f"{key.replace(':', '_')}.json"

    if marker.exists():
        meta = json.loads(marker.read_text())
        if Path(meta["path"]).exists():
            return meta["path"]
        marker.unlink()          # artifact gone, drop the marker

    path = produce()
    marker.write_text(json.dumps({
        "path": str(path),
        "created": datetime.now(timezone.utc).isoformat(),
    }))
    return path
```

Checking that the artifact still exists is what keeps this honest. A marker pointing at a deleted file is worse than no marker.

## Retries become free

The second benefit is bigger than the caching. A stage keyed on its input is idempotent, so a retry after a transient failure re-does only the work that did not complete.

```python
for attempt in range(max_attempts):
    try:
        return cached(key, lambda: call_api(scene), store)
    except TransientError:
        if attempt == max_attempts - 1:
            raise
        time.sleep(base_delay * (2 ** attempt) + random.uniform(0, 0.5))
```

Without idempotency, a retry policy on a paid API is a policy for spending more money.

## Clean test residue

One that bit me: a failed-items database left over from testing contained fabricated entries. On the next real run they fed straight into the retry path and produced work nobody asked for.

Keep scratch output out of the directories the pipeline reads. If a test writes into the live tree, it is not a test any more — it is an input.

## What it is worth

At my measured rate, image generation is 96% of per-video cost. A single avoided rerun pays for the afternoon it took to build this. Across a library where many scenes are semantically near-identical, the cache stops being a retry optimisation and becomes a margin.
