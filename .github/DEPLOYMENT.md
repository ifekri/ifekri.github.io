# iFekri Deployment Guide

Live site: https://ifekri.gitlab.io

## Verify the repository feed

1. Open the live site homepage — "Selected work" should list recent public repos.
2. Open `/projects/` — filter chips for All / GitHub / GitLab should appear.
3. If nothing loads, check:
   - `github.username` and `gitlab.username` in `_config.yml`
   - Browser console for CORS / rate-limit errors
   - That the accounts actually have public repositories

## Optional: higher rate limits

Create a fine-grained GitHub personal access token with `public_repo` (or `read:user` + `repo` for private).
Do **not** put it in `_config.yml` on a public repo. Instead, inject it at build time if you ever move the feed server-side. The current client-side feed works without a token for public repos.
