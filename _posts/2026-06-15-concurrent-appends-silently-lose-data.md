---
title: "Concurrent appends silently lose data"
date: 2026-06-15 09:45:00 +0300
categories: [Reliability]
tags: [python, concurrency, logging, telemetry]
description: "Eight threads appending to one JSONL file dropped 7% of events. Nothing crashed, nothing corrupted, and the total was simply wrong."
---

I turned on concurrency in a generation pipeline and my cost telemetry started under-reporting. Not by a visible amount. By seven percent — small enough to look like rounding, large enough to make every pricing decision wrong.

<!--more-->

## The failure mode

Append mode is not atomic across threads. Each writer opens the file, seeks to what it believes is the end, and writes there. Two threads that seek at the same moment get the same offset, and the second write lands on top of the first.

The result is not corruption. Every line is valid JSON. The file simply has fewer lines than events.

```python
# Reproduce it
import threading, json, os

PATH = "events.jsonl"

def writer(n):
    for i in range(100):
        with open(PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps({"worker": n, "i": i}) + "\n")

threads = [threading.Thread(target=writer, args=(n,)) for n in range(8)]
for t in threads: t.start()
for t in threads: t.join()

print(sum(1 for _ in open(PATH)), "of 800")
```

On my machine that printed 747. Run it again and you get a different number. That non-determinism is why it survives casual testing.

## The fix

A module-level lock, held across both the write and the flush.

```python
import threading, json
from pathlib import Path

_WRITE_LOCK = threading.Lock()

def record(event: dict, path: Path) -> None:
    line = json.dumps(event, ensure_ascii=False)
    with _WRITE_LOCK:
        with path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
```

Flushing inside the lock matters. Without it, buffered content can be written out after the lock is released, which puts you back where you started.

## Verify with a count, not a glance

```python
expected = 800
actual = sum(1 for _ in open(PATH))
assert actual == expected, f"lost {expected - actual} events"
```

Any telemetry that feeds a business decision deserves this assertion in a test. A metric that is quietly wrong is worse than a metric that is missing, because you act on it.

## The limit worth knowing now

This lock is process-level. The moment you move from threads to multiple worker processes — which is what happens when a pipeline becomes a job queue — it stops protecting anything and the same 7% comes back.

At that point you need one of:

- **`fcntl.flock`** on POSIX, so the lock is held by the OS rather than the interpreter
- **One writer per process**, with a process ID in the filename, merged at read time
- **A real sink** — Redis, Postgres, or a logging service

I picked filenames per process. It is the least clever option and it cannot race.

The general lesson: telemetry code is the code most likely to be written quickly and tested least, and it is also the code whose failure you cannot see from its output.
