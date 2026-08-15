---
title: "Your price table is wrong"
date: 2026-08-08 11:05:00 +0300
categories: [Engineering]
tags: [api, cost-optimisation, telemetry, openrouter]
description: "I estimated $0.030 per image. The provider billed $0.034. Thirteen percent is invisible in a monthly total and fatal in a margin."
---

I built cost tracking, wired a rate table into it, and got a number I trusted. Then I made one real call and compared it to what I had been reporting. The estimate was 13% low.

<!--more-->

## Estimates drift for reasons you cannot see

A hardcoded rate table goes stale in every direction at once. Providers change pricing. Your model string silently falls back to a more expensive one when the primary is unavailable. Token counting differs from the provider's own accounting. Requests carry overhead you never counted.

None of these announce themselves. Your total stays plausible while being consistently wrong.

## Ask the provider instead

Most gateways will return the billed amount if you ask. On an OpenAI-compatible endpoint it is one field:

```python
payload = {
    "model": model,
    "messages": messages,
    "usage": {"include": True},      # <- this line
}
resp = requests.post(endpoint, json=payload, headers=headers, timeout=120)
data = resp.json()

usage = data.get("usage", {})
if "cost" in usage:
    cost, estimated = float(usage["cost"]), False
else:
    cost, estimated = estimate_from_table(model, usage), True
```

Fall back to the table rather than replacing it. Not every provider returns cost, and you still want a number for the ones that do not.

## Mark every row with its provenance

```
provider    model (purpose)                       calls      cost
---------------------------------------------------------------
openrouter  gemini-flash-image (image)              149    5.0735
elevenlabs  scribe (stt)                              6    0.1492  EST
openrouter  gemini-flash-lite (director)              1    0.0181
---------------------------------------------------------------
TOTAL                                                     5.2408
```

That `EST` flag is not decoration. It tells you which rows you may price against and which you may not. When somebody asks what a unit costs, you can answer precisely for the measured portion and honestly about the rest.

## Verify at volume, not once

One call proves the field parses. It does not prove the provider returns it reliably.

```python
events = [json.loads(l) for l in open(log_path)]
actual = sum(1 for e in events if not e["estimated"])
print(f"{actual}/{len(events)} actual")

costs = [e["cost_usd"] for e in events if not e["estimated"]]
print(f"min {min(costs):.5f}  mean {sum(costs)/len(costs):.5f}  max {max(costs):.5f}")
```

Twenty of twenty came back actual, clustered between $0.03377 and $0.03452. Tight clustering is itself a signal — wide spread would have meant a fallback model was being used more often than I thought.

## Update the fallback with what you learned

```python
PRICES = {
    "gemini-flash-image": 0.034,   # measured 2026-08, was 0.030 (est.)
}
```

Even with real cost available, keep the table honest. It is what runs when the provider omits the field, and a stale fallback reintroduces the same drift through a smaller door.

## The number that matters

At the measured rate, a 149-image job is $5.07 rather than the $4.47 I had been reporting. On one video that is 60 cents. On a price list built for thousands of them, it is the difference between a margin and a slow loss.

Measure the thing you sell. Estimate only what you cannot measure, and label it.
