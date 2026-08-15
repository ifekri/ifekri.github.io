---
title: "Cost per finished minute"
date: 2026-06-29 13:00:00 +0300
categories: [Engineering]
tags: [telemetry, unit-economics, api, pipelines]
description: "If you are building on paid model APIs, one number decides whether you have a business. Most pipelines never compute it."
---

Everyone building on model APIs knows roughly what their bill is. Almost nobody knows what a single unit of output costs. Those are different numbers, and only the second one lets you price anything.

<!--more-->

## Pick a denominator the customer recognises

Cost per API call is an engineering metric. Cost per token is a vendor metric. Neither one is something a buyer can reason about.

Pick the unit you sell: a finished minute of video, a processed document, a completed report. Then measure everything against it.

```python
summary = {
    "total_cost_usd": 5.24,
    "output_seconds": 1492,
}
per_minute = summary["total_cost_usd"] / (summary["output_seconds"] / 60)
print(f"${per_minute:.4f} per finished minute")   # $0.2107
```

That number goes on the pricing page. Nothing else does.

## Log the event, not the total

Running totals hide the shape of your spend. Append one record per call and aggregate later.

```python
def record_api_call(job_id, provider, model, purpose, units, cost_usd, estimated):
    record({
        "kind": "api",
        "job_id": job_id,
        "provider": provider,
        "model": model,
        "purpose": purpose,      # "director", "image", "stt"
        "units": units,          # {"images": 1, "prompt_tokens": 300}
        "cost_usd": cost_usd,
        "estimated": estimated,  # False when the provider returned real cost
        "ts": datetime.now(timezone.utc).isoformat(),
    }, path=cost_log_for(job_id))
```

The `purpose` field is what makes the log actionable. Mine showed 96% of spend in one category. Everything else was noise, and every optimisation I had planned for the other 4% was wasted effort.

## Telemetry must never break the job

Wrap every public function so a logging failure cannot take down a render.

```python
import functools, sys

def safe(default=None):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                print(f"[cost] {fn.__name__} failed: {e}", file=sys.stderr)
                return default
        return wrapper
    return deco
```

A pipeline that dies because it could not write a cost line is worse than one with no cost tracking at all.

## Never report an unpriced call as free

When you do not know a provider's rate, the tempting default is zero. That is a lie your future self will believe.

```
runpod  veo3-i2v   5 calls   $0.0000  UNPRICED
  clips=5, execution_seconds=210

WARNING: no price configured for the above -- counted but
         contributing $0.00, so TOTAL is understated
```

Record the units regardless. When you learn the rate, past logs become re-pricable, and you have not lost history.

## Cross the pipeline boundary with the environment

Stages that run as subprocesses need the same job ID without threading it through every call signature.

```python
os.environ["PIPELINE_JOB_ID"] = job_id
os.environ["PIPELINE_COST_LOG"] = str(log_path)
# Children built with {**os.environ} inherit both and append to one file
```

## What it bought me

My estimated rate table was 13% below what the provider actually billed. Thirteen percent is invisible in a monthly total and fatal in a margin calculation.

I now request real billed cost wherever the provider will return it, and mark every estimated row so I know which numbers I am allowed to price against.
