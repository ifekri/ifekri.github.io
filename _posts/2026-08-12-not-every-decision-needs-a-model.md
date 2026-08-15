---
title: "Not every decision needs a model"
date: 2026-08-12 16:50:00 +0300
categories: [Architecture]
tags: [llm, determinism, architecture, cost-optimisation]
description: "I was paying a language model to make choices that a weighted table makes better: faster, cheaper, reproducible, and testable."
---

My pipeline called a language model to plan every scene in a video — shot type, camera angle, framing. It worked. It was also the wrong tool, and I only saw it after writing the deterministic version.

<!--more-->

## What the model was actually deciding

"Should this scene be a close-up or a wide shot?"

That is not a language problem. It is a weighted choice constrained by a few rules: vary the framing, avoid jarring transitions, tighten during emotional peaks, open up at the start and end.

```python
SHOT_WEIGHTS = {
    "extreme_closeup": 0.10,
    "closeup":         0.25,
    "medium":          0.30,
    "wide":            0.25,
    "overhead":        0.05,
    "insert":          0.05,
}

INVALID_TRANSITIONS = {
    ("extreme_closeup", "wide"),
    ("wide", "extreme_closeup"),
    ("overhead", "extreme_closeup"),
}
```

A hundred lines of Python covers it, and covers it better.

## Constraints are easier to enforce than to describe

Telling a model "do not use the same shot more than twice in a row" is a request. In code it is a guarantee.

```python
def next_shot(self, index, total, intensity=0.5):
    weights = self._adjust_for_arc(index, total, intensity)

    if self.recent:
        last = self.recent[-1]
        if self._run_length(last) >= self.max_consecutive:
            weights[last] = 0.0          # hard block, not a nudge

    shot = self._weighted_choice(weights)

    if self.recent and (self.recent[-1], shot) in INVALID_TRANSITIONS:
        shot = self._pick_valid(self.recent[-1], weights)

    self.recent.append(shot)
    return shot
```

One detail there cost me real output quality. My first version damped the repeated shot's weight to `0.1` instead of zeroing it. Runs of three still slipped through, and a limit that is *usually* enforced is not a limit. Set it to zero.

## Seeding buys you reproducibility

```python
planner = ShotPlanner(style="mixed", seed=42)
```

Same seed, same plan, every time. That means you can regenerate a job after fixing something downstream and get an identical structure, and you can write tests against the planner:

```python
def test_no_long_runs():
    p = ShotPlanner(style="mixed", seed=42)
    seq = [p.next_shot(i, 149).value for i in range(149)]

    run = worst = 1
    for a, b in zip(seq, seq[1:]):
        run = run + 1 if a == b else 1
        worst = max(worst, run)

    assert worst <= 2, f"run of {worst}"
```

You cannot write that test against a model call.

## The comparison

| | model call | weighted table |
|---|---|---|
| latency | seconds | microseconds |
| cost per job | non-zero | zero |
| reproducible | no | with a seed |
| testable | not really | yes |
| enforces hard limits | asks | guarantees |

## Where the model still earns its place

Interpreting the actual content of a scene. "This passage is about betrayal in a rain-soaked alley" is a language task, and no lookup table produces it.

Split the two. Let the model read meaning; let code decide structure. In my pipeline that removed an entire class of API calls, made output reproducible, and — the part I did not expect — improved consistency, because rules that are enforced beat rules that are requested.

One warning from my own experience: the deterministic planner sat in my codebase for months, disabled by an argument-name mismatch, silently falling back to the model on every run. Log your fallbacks loudly. A silent fallback is a feature you are paying for and not receiving.
