---
title: "Deploy pipelines that don't wake you up"
date: 2026-07-08 10:00:00 +0300
categories: [Infrastructure]
tags: [ci-cd, deploy, reliability]
description: "How I design CI/CD so a bad deploy is a non-event, not a 3am incident."
---

The best deploy pipeline is the one you never think about. Code merges, tests run, artifacts build, production updates, and nobody gets paged. That's the goal. Everything else is a compromise.

<!--more-->

## The failure mode that matters

Most pipelines fail in the same way: a change passes CI, lands in production, and breaks something that CI never tested. The fix is not more tests. The fix is a pipeline that assumes failure and routes around it.

## Three rules

**1. Every deploy is reversible in one step.** If rolling back requires a meeting, your pipeline is broken. Rollback should be a button, not a procedure.

**2. Health checks gate the rollout.** A deploy that reports success while the app is crash-looping is a liar. The pipeline should verify the service is actually healthy before it calls the job done.

**3. Small batches beat big bangs.** Ten small deploys a day is safer than one large deploy a week. The blast radius of each change stays small, and the cause of any failure is obvious.

## A minimal GitLab pipeline

```yaml
stages:
  - test
  - build
  - deploy
  - verify

test:
  stage: test
  script:
    - bundle exec rspec

build:
  stage: build
  script:
    - docker build -t app:$CI_COMMIT_SHORT_SHA .
    - docker push registry.example.com/app:$CI_COMMIT_SHORT_SHA

deploy:
  stage: deploy
  script:
    - ./scripts/deploy.sh $CI_COMMIT_SHORT_SHA
  environment:
    name: production

verify:
  stage: verify
  script:
    - ./scripts/healthcheck.sh || ./scripts/rollback.sh
```

The `verify` stage is the part most teams skip. It's also the part that matters most. If the health check fails, the pipeline rolls back automatically and alerts the team. No human required.

## What "healthy" means

A health check is not a 200 response from `/`. It's a check that the service can actually do its job: connect to the database, reach its dependencies, and respond within a latency budget.

```bash
#!/usr/bin/env bash
# healthcheck.sh
set -euo pipefail

for i in {1..12}; do
  if curl -sf --max-time 5 https://app.example.com/health/deep > /dev/null; then
    echo "healthy"
    exit 0
  fi
  sleep 10
done

echo "unhealthy after 2 minutes"
exit 1
```

The `/health/deep` endpoint checks the database connection, the cache, and any critical downstream services. A shallow ping tells you the process is alive. A deep check tells you the service is working.

## The real lesson

Pipelines are not about automation. They're about trust. When the team trusts the pipeline, they deploy often, they take smaller risks, and they sleep through the night. When they don't, they batch changes, delay releases, and get woken up anyway.

Build the pipeline you'd trust at 3am. Then never get woken up by it.
