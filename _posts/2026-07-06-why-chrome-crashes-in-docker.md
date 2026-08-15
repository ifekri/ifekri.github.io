---
title: "Why Chrome crashes in Docker"
date: 2026-07-06 10:30:00 +0300
categories: [Docker]
tags: [docker, chrome, puppeteer, rendering, debugging]
description: "Headless Chrome dies inside a container with an error that tells you nothing. The cause is a single default nobody thinks to check."
---

Your renderer works on the host. Inside a container it dies partway through, usually with something as unhelpful as `Target closed` or `Protocol error`. The logs point nowhere useful.

<!--more-->

## Sixty-four megabytes

Docker gives every container a `/dev/shm` of 64MB. Chrome uses shared memory heavily for its renderer processes, and 64MB runs out fast — faster the more tabs or frames you render in parallel.

Check what your container actually has:

```bash
docker run --rm my-renderer df -h /dev/shm
# Filesystem  Size  Used Avail Use% Mounted on
# shm          64M     0   64M   0% /dev/shm
```

Now compare it to the host, which typically has half of RAM available. The gap is the bug.

## The fix

```yaml
services:
  renderer:
    build: .
    shm_size: '2gb'
```

Or on the command line:

```bash
docker run --shm-size=2g my-renderer
```

Two gigabytes is comfortable for most rendering work. If you run several jobs concurrently in one container, scale it up rather than guessing.

## The flag you will be told to use instead

Every thread on this suggests `--disable-dev-shm-usage`, which makes Chrome write to `/tmp` instead of shared memory.

```javascript
const browser = await puppeteer.launch({
  args: ['--disable-dev-shm-usage'],  // works, but slower
});
```

It does work. It also moves that traffic from memory to disk, which costs you throughput on exactly the workload you containerised for speed. Use it when you cannot control the runtime; set `shm_size` when you can.

## While you are in there

Two more that bite in the same place:

```dockerfile
# Chrome needs system libraries a slim image does not carry
RUN apt-get update && apt-get install -y --no-install-recommends \
        libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
        libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
        libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libasound2 \
    && rm -rf /var/lib/apt/lists/*
```

And do not reach for `--no-sandbox` as a first move. It silences a class of permission errors by removing a security boundary, on a process that renders content you may not control. Run the container as a non-root user and keep the sandbox.

## The general shape

The symptom appeared in Chrome. The cause was a container default that has nothing to do with Chrome. When something works on the host and fails in a container, compare the two environments directly — `df`, `ulimit`, `nproc`, `fc-list` — before you debug the application at all.
