---
title: "sys.path.insert will shadow your modules"
date: 2026-07-27 09:00:00 +0300
categories: [Python]
tags: [python, imports, debugging, packaging]
description: "One line added a shared helper to a staged pipeline and made a completely unrelated import resolve to the wrong file, but only sometimes."
---

I needed a shared telemetry module reachable from every stage of a pipeline whose stages live in separate directories. The quick fix:

```python
sys.path.insert(0, PROJECT_ROOT)
import cost_tracker
```

It worked. It also introduced an `ImportError` in a module I had not touched, which only appeared under one import order.

<!--more-->

## What insert(0) actually does

`sys.path` is searched in order. Putting the project root at position zero means it is searched *before* the directory of the module doing the importing.

My layout had a `config_manager.py` at the root and another inside a stage directory. They were different files with different contents, and the stage relied on its local one.

```
project/
  config_manager.py            <- generic
  cost_tracker.py
  03_image-generator/
    config_manager.py          <- stage-specific
    generator.py               <- expects the local one
    runpod_provider.py
```

After `insert(0, PROJECT_ROOT)`, `from config_manager import config` inside the stage resolved to the root file. Same name, different module, missing attribute.

## Why it only failed sometimes

Import order decided the outcome. Python caches modules in `sys.modules` by name, so whichever import ran first won and the second silently received it.

```python
# Order A — generator imports its config first, caches the local one
import generator            # config_manager -> stage-local
import runpod_provider      # gets the cached stage-local one, fine

# Order B — runpod_provider goes first, and the root wins
import runpod_provider      # config_manager -> root
import generator            # gets the cached root one, ImportError
```

In practice order A happened to be the common path, so the bug existed for a while without firing. Those are the ones that surface in production.

## The fix

```python
sys.path.append(PROJECT_ROOT)   # not insert(0, ...)
```

`append` puts the root last. Stage-local modules keep priority; the shared helper is still reachable because nothing else defines that name.

## Verify resolution, do not assume it

```python
import config_manager
print(config_manager.__file__)
# .../03_image-generator/config_manager.py   <- correct
```

Test both orders explicitly. It takes one extra line and it is the only thing that catches this class of bug:

```python
# tests/test_import_order.py
import subprocess, sys

for first, second in [("generator", "runpod_provider"),
                      ("runpod_provider", "generator")]:
    code = f"import {first}, {second}; import config_manager; print(config_manager.__file__)"
    out = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
    assert "03_image-generator" in out.stdout, f"{first} first -> {out.stdout}"
```

## The better fix

Path manipulation is a workaround. The real answer is packaging: make the shared code a proper package, install it with `pip install -e .`, and let normal resolution do its job.

```
project/
  pyproject.toml
  src/pipeline_common/
    __init__.py
    cost_tracker.py
```

```python
from pipeline_common import cost_tracker   # unambiguous, order-independent
```

If you are past a couple of stages, do this instead of reaching for `sys.path`. Duplicate module names across a repository are a slow-burning fuse, and `insert(0, ...)` is what lights it.
