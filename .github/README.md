# iFekri

A dark, Jekyll template for developer portfolios and technical blogs.
Operator console aesthetic. No stock photography required. Pure typography, code, and signal.

Live demo: **https://ifekri.github.io** · Fork-friendly · MIT licensed

---

## Features

- **Dual repository feed** — pulls public repos from **GitHub** and **GitLab** at runtime; no build step, no tokens for public projects
- **Operator console hero** — terminal-style animated intro with status readouts
- **Blog with categories & tags** — markdown posts, syntax highlighting via Rouge
- **Projects page** — live repo grid with source filtering, stars, forks, and topics
- **Responsive & accessible** — respects `prefers-reduced-motion`, semantic markup
- **SEO & feeds** — sitemap, RSS/Atom, Open Graph via `jekyll-seo-tag`

---

## Quick Start

### 1. Use this template

Click **"Use this template"** on GitHub, or fork the repo and clone it:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Configure your identity

Edit `_config.yml`. Change the values under `owner`, `github`, `gitlab`, and `repos`:

```yaml
owner:
  name: "Your Name"
  handle: "yourusername"
  bio: "Your short bio."
  github: "yourusername"
  gitlab: "yourusername"

repos:
  source: "both"          # github | gitlab | both
  home_limit: 4
  exclude_forks: true

github:
  enabled: true
  username: "yourusername"
  exclude: ["yourusername.github.io"]
  pinned: ["my-best-project"]

gitlab:
  enabled: true
  username: "yourusername"
  exclude: ["yourusername.gitlab.io"]
  pinned: []
```

Also update `url` and `baseurl` to match your deployment target.

### 3. Run locally

Requires Ruby 3.0+ and Bundler:

```bash
bundle install
bundle exec jekyll serve --livereload
```

Open `http://localhost:4000` in your browser.

### 4. Push and deploy

```bash
git add .
git commit -m "Customize iFekri"
git push origin main
```

GitHub Actions will build and deploy automatically if GitHub Pages is enabled.

---

## Deployment

### GitHub Pages

1. Go to **Settings → Pages**.
2. Under **Source**, choose **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/pages-deploy.yml` handles the rest.

Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO` (or `https://YOUR_USERNAME.github.io` for a user site).

### GitLab Pages

1. Create a project on GitLab.
2. Push your code to the `main` branch.
3. The `.gitlab-ci.yml` pipeline will build and deploy automatically.

Your site will be live at `https://YOUR_USERNAME.gitlab.io/YOUR_REPO`.

---

## Repository feed options

Control what shows up on the home page and `/projects`:

| Option | Where | Purpose |
|--------|-------|---------|
| `repos.source` | `_config.yml` | `github`, `gitlab`, or `both` |
| `repos.home_limit` | `_config.yml` | How many repos on the homepage |
| `repos.exclude_forks` | `_config.yml` | Hide forked repositories |
| `repos.exclude_archived` | `_config.yml` | Hide archived repositories |
| `repos.sort_by` | `_config.yml` | `updated`, `stars`, or `name` |
| `github.username` / `gitlab.username` | `_config.yml` | Account names |
| `github.exclude` / `gitlab.exclude` | `_config.yml` | Repos to hide by name |
| `github.pinned` / `gitlab.pinned` | `_config.yml` | Repos to float to the top |
| `github.token` / `gitlab.token` | `_config.yml` | Optional tokens for higher rate limits / private repos |

> **Security note:** Never commit a token to a public repository. If you need private repos, use a GitHub Actions secret and inject it at build time, or keep the site client-side public only.

---

## Writing posts

Create a file in `_posts/` with the naming convention:

```
_posts/YYYY-MM-DD-your-title.md
```

Front matter:

```markdown
---
title: "Your Title"
date: 2026-08-10 10:00:00 +0300
categories: [Engineering]
tags: [systems, rust]
description: "One-line summary for SEO."
---

Intro paragraph.

<!--more-->

Rest of the post.
```

---

## Customizing the look

All tokens live in `assets/css/style.css` under `:root`:

```css
:root {
  --accent: #E8A838;        /* Change accent color */
  --bg: #0b0d10;            /* Background */
  --text: #d7dde3;          /* Primary text */
  --font-mono: 'IBM Plex Mono', monospace;
  --font-sans: 'IBM Plex Sans', sans-serif;
}
```

You can also override the accent in `_config.yml`:

```yaml
accent: "#10B981"  # emerald
```

---

## Project structure

```
.
├── _config.yml                 # Site configuration
├── _data/navigation.yml        # Header nav
├── _includes/                  # Reusable HTML partials
├── _layouts/                   # Page templates
├── _posts/                     # Blog posts
├── _tabs/                      # Secondary pages (about, archives, tags)
├── assets/
│   ├── css/style.css           # Design system
│   └── js/main.js              # Interactive features
├── .github/workflows/          # GitHub Actions
├── .gitlab-ci.yml              # GitLab CI/CD
├── projects.md                 # Live repo grid
└── index.md                    # Homepage
```

---

## Contributing

Issues and pull requests welcome. Please read `CONTRIBUTING.md` before submitting.

---

## License

MIT. Use it, remix it, ship it.
