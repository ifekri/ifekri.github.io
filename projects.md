---
layout: page
title: Work
kicker: Live from source
description: "Public repositories pulled straight from GitHub and GitLab, updated on every visit."
permalink: /projects/
---

<div class="repo-toolbar" id="repo-toolbar" hidden>
  <div class="repo-filters" role="tablist" aria-label="Repository source">
    <button type="button" class="repo-filter is-active" data-filter="all" role="tab" aria-selected="true">All</button>
    <button type="button" class="repo-filter" data-filter="github" role="tab" aria-selected="false">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>
      GitHub
    </button>
    <button type="button" class="repo-filter" data-filter="gitlab" role="tab" aria-selected="false">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.919 1.263a.455.455 0 0 0-.867 0L1.388 9.452.045 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.624-8.443a.92.92 0 0 0 .331-1.024"/></svg>
      GitLab
    </button>
  </div>
  <p class="repo-count" id="repo-count" aria-live="polite"></p>
</div>

<div
  id="repo-grid"
  class="projects-grid"
  data-repos-source="{{ site.repos.source | default: 'both' }}"
  data-github-user="{{ site.github.username | default: site.owner.github }}"
  data-github-enabled="{{ site.github.enabled | default: true }}"
  data-github-token="{{ site.github.token }}"
  data-github-exclude="{{ site.github.exclude | join: ',' }}"
  data-github-pinned="{{ site.github.pinned | join: ',' }}"
  data-gitlab-user="{{ site.gitlab.username | default: site.owner.gitlab }}"
  data-gitlab-host="{{ site.gitlab.host | default: 'https://gitlab.com' }}"
  data-gitlab-enabled="{{ site.gitlab.enabled | default: true }}"
  data-gitlab-token="{{ site.gitlab.token }}"
  data-gitlab-exclude="{{ site.gitlab.exclude | join: ',' }}"
  data-gitlab-pinned="{{ site.gitlab.pinned | join: ',' }}"
  data-per-page="{{ site.github.per_page | default: 100 }}"
  data-home-limit="0"
  data-exclude-forks="{{ site.repos.exclude_forks | default: true }}"
  data-exclude-archived="{{ site.repos.exclude_archived | default: true }}"
  data-sort-by="{{ site.repos.sort_by | default: 'updated' }}"
  data-mode="cards"
  aria-live="polite"
>
  <div class="repo-loading">
    <span class="repo-spinner" aria-hidden="true"></span>
    <span>Establishing link to repository index…</span>
  </div>
</div>

<noscript>
  <div class="repo-empty">
    <p>The live project feed needs JavaScript. Browse the source directly:</p>
    <p style="margin-top:1rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
      {% if site.github.enabled != false and site.github.username %}
      <a href="https://github.com/{{ site.github.username }}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
        <span>View on GitHub</span>
      </a>
      {% endif %}
      {% if site.gitlab.enabled != false and site.gitlab.username %}
      <a href="{{ site.gitlab.host | default: 'https://gitlab.com' }}/{{ site.gitlab.username }}" class="btn btn-ghost" target="_blank" rel="noopener noreferrer">
        <span>View on GitLab</span>
      </a>
      {% endif %}
    </p>
  </div>
</noscript>
