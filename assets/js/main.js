/**
 * iFekri - Main JavaScript
 * Handles: mobile nav, header clock, console typing, scroll reveal, skill bars,
 *          and a combined GitHub + GitLab repository feed.
 */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Mobile Navigation ----------
  function initMobileNav() {
    var toggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('mobile-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.classList.toggle('is-open');
      nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      nav.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('.mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('is-open');
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Header Scroll State ----------
  function initHeaderScroll() {
    var header = document.getElementById('site-header');
    if (!header) return;

    var ticking = false;

    function update() {
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  // ---------- UTC Clock ----------
  function initClock() {
    var el = document.getElementById('header-clock');
    if (!el) return;

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tick() {
      var d = new Date();
      el.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
    }

    tick();
    setInterval(tick, 1000);
  }

  // ---------- Hero Console Typing ----------
  function initConsole() {
    var body = document.getElementById('hero-console-body');
    if (!body) return;

    var lines = body.querySelectorAll('.console-line');
    if (!lines.length) return;

    // Assign sequential delays
    lines.forEach(function (line, i) {
      line.setAttribute('data-delay', String(i + 1));
      line.style.animationDelay = (i * 0.28) + 's';
    });

    if (reducedMotion) return;

    // Type out command lines
    var cmdLines = body.querySelectorAll('.console-line[data-type="cmd"] .console-text[data-text]');
    cmdLines.forEach(function (el, idx) {
      var full = el.getAttribute('data-text');
      var delay = 300 + idx * 900;
      el.textContent = '';

      setTimeout(function () {
        var i = 0;
        var timer = setInterval(function () {
          el.textContent = full.slice(0, i + 1);
          i++;
          if (i >= full.length) clearInterval(timer);
        }, 42);
      }, delay);
    });
  }

  // ---------- Scroll Reveal ----------
  function initReveal() {
    var els = document.querySelectorAll(
      '.note-card, .cap-block, .work-row, .project-card, .contact-panel, .timeline-item, .about-panel, .tag-chip, .post-row'
    );
    if (!els.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    els.forEach(function (el) { el.classList.add('reveal'); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    els.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.06 + 's';
      observer.observe(el);
    });
  }

  // ---------- Skill Bars ----------
  function initSkillBars() {
    var fills = document.querySelectorAll('.skill-fill[data-level]');
    if (!fills.length) return;

    function setFill(el) {
      el.style.width = el.getAttribute('data-level') + '%';
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      fills.forEach(setFill);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setFill(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    fills.forEach(function (el) { observer.observe(el); });
  }

  // ============================================================
  // Repository Feed (GitHub + GitLab)
  // ============================================================

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function langColor(lang) {
    var map = {
      JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
      Rust: '#dea584', Go: '#00ADD8', Ruby: '#701516', HTML: '#e34c26',
      CSS: '#563d7c', Shell: '#89e051', C: '#9b9b9b', 'C++': '#f34b7d',
      Java: '#b07219', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
      Lua: '#000080', Zig: '#ec915c', Haskell: '#5e5086', Elixir: '#6e4a7e'
    };
    return map[lang] || 'var(--accent)';
  }

  function sourceIcon(source) {
    if (source === 'github') {
      return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>';
    }
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.919 1.263a.455.455 0 0 0-.867 0L1.388 9.452.045 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.624-8.443a.92.92 0 0 0 .331-1.024"/></svg>';
  }

  function csvToSet(str) {
    if (!str) return new Set();
    return new Set(str.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean));
  }

  function fetchGitHubRepos(cfg) {
    if (cfg.enabled === false || cfg.enabled === 'false' || !cfg.username) {
      return Promise.resolve({ items: [], error: null });
    }
    var url = 'https://api.github.com/users/' + encodeURIComponent(cfg.username) +
      '/repos?per_page=' + cfg.perPage + '&sort=updated&direction=desc';
    var headers = { 'Accept': 'application/vnd.github+json' };
    if (cfg.token) {
      headers['Authorization'] = 'Bearer ' + cfg.token;
    }
    return fetch(url, { headers: headers })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub HTTP ' + res.status);
        return res.json();
      })
      .then(function (repos) {
        var excluded = csvToSet(cfg.exclude);
        var pinned = cfg.pinned ? cfg.pinned.split(',').map(function (s) { return s.trim().toLowerCase(); }) : [];
        var items = repos.map(function (r) {
          return {
            source: 'github',
            name: r.name,
            url: r.html_url,
            description: r.description || '',
            language: r.language || '',
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            topics: r.topics || [],
            updated: r.updated_at || '',
            pushed: r.pushed_at || '',
            forked: !!r.fork,
            archived: !!r.archived,
            pinned: pinned.indexOf(r.name.toLowerCase()) !== -1
          };
        }).filter(function (r) {
          if (excluded.has(r.name.toLowerCase())) return false;
          if (cfg.excludeForks && r.forked) return false;
          if (cfg.excludeArchived && r.archived) return false;
          return true;
        });
        return { items: items, error: null };
      })
      .catch(function (err) {
        return { items: [], error: { source: 'github', message: err.message } };
      });
  }

  function fetchGitLabRepos(cfg) {
    if (cfg.enabled === false || cfg.enabled === 'false' || !cfg.username) {
      return Promise.resolve({ items: [], error: null });
    }
    var url = cfg.host + '/api/v4/users/' + encodeURIComponent(cfg.username) +
      '/projects?per_page=' + cfg.perPage + '&order_by=last_activity_at&sort=desc&simple=false';
    var headers = { 'Accept': 'application/json' };
    if (cfg.token) {
      headers['PRIVATE-TOKEN'] = cfg.token;
    }
    return fetch(url, { headers: headers })
      .then(function (res) {
        if (!res.ok) throw new Error('GitLab HTTP ' + res.status);
        return res.json();
      })
      .then(function (repos) {
        var excluded = csvToSet(cfg.exclude);
        var pinned = cfg.pinned ? cfg.pinned.split(',').map(function (s) { return s.trim().toLowerCase(); }) : [];
        var items = repos.map(function (r) {
          return {
            source: 'gitlab',
            name: r.name,
            url: r.web_url,
            description: r.description || '',
            language: r.language || r.primary_language || '',
            stars: r.star_count || 0,
            forks: r.forks_count || 0,
            topics: r.topics || [],
            updated: r.last_activity_at || '',
            pushed: r.last_activity_at || '',
            forked: !!r.forked_from_project,
            archived: !!r.archived,
            pinned: pinned.indexOf(r.name.toLowerCase()) !== -1
          };
        }).filter(function (r) {
          if (excluded.has(r.name.toLowerCase())) return false;
          if (cfg.excludeForks && r.forked) return false;
          if (cfg.excludeArchived && r.archived) return false;
          return true;
        });
        return { items: items, error: null };
      })
      .catch(function (err) {
        return { items: [], error: { source: 'gitlab', message: err.message } };
      });
  }

  function sortRepos(items, sortBy) {
    return items.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      var da = new Date(a.pushed || a.updated || 0);
      var db = new Date(b.pushed || b.updated || 0);
      return db - da;
    });
  }

  function renderRepos(el, items, mode) {
    if (!items.length) {
      el.innerHTML =
        '<div class="repo-empty">' +
        '<p>No public repositories found.</p>' +
        '</div>';
      return;
    }

    if (mode === 'rows') {
      el.innerHTML = items.map(function (r, i) {
        var lang = r.language || '';
        var topics = (r.topics && r.topics.length) ? r.topics.slice(0, 2) : (lang ? [lang] : []);
        return (
          '<a href="' + esc(r.url) + '" class="work-row" data-source="' + esc(r.source) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="work-index">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<div class="work-body">' +
          '<h3 class="work-name">' +
          '<span class="repo-source-icon repo-source-icon--' + esc(r.source) + '">' + sourceIcon(r.source) + '</span>' +
          esc(r.name) +
          (r.pinned ? '<span class="repo-pinned">Pinned</span>' : '') +
          '</h3>' +
          '<p class="work-desc">' + esc(r.description || 'No description provided.') + '</p>' +
          '</div>' +
          '<div class="work-meta">' +
          (lang ? '<span class="work-cat"><span class="repo-lang-dot" style="background:' + langColor(lang) + '"></span>' + esc(lang) + '</span>' : '') +
          '<div class="work-stack">' +
          topics.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') +
          '</div>' +
          '<span class="repo-stars">★ ' + r.stars + '</span>' +
          '</div>' +
          '<span class="work-arrow" aria-hidden="true">↗</span>' +
          '</a>'
        );
      }).join('');
      return;
    }

    // cards mode (projects page)
    el.innerHTML = items.map(function (r) {
      var lang = r.language || '';
      var updated = r.updated ? r.updated.slice(0, 10) : '';
      var topics = (r.topics || []).slice(0, 4);
      return (
        '<article class="project-card repo-card" data-source="' + esc(r.source) + '">' +
        '<div class="project-card-top">' +
        (lang
          ? '<span class="project-cat"><span class="repo-lang-dot" style="background:' + langColor(lang) + '"></span>' + esc(lang) + '</span>'
          : '<span class="project-cat">Repository</span>') +
        '<span class="project-status repo-source-badge repo-source-badge--' + esc(r.source) + '">' +
        sourceIcon(r.source) + '<span>' + esc(r.source) + '</span>' +
        '</span>' +
        '</div>' +
        '<h3 class="project-name">' +
        esc(r.name) +
        (r.pinned ? '<span class="repo-pinned">Pinned</span>' : '') +
        '</h3>' +
        '<p class="project-desc">' + esc(r.description || 'No description provided.') + '</p>' +
        (topics.length
          ? '<div class="project-stack">' + topics.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>'
          : '') +
        '<div class="repo-stats">' +
        '<span class="repo-stat">★ ' + r.stars + '</span>' +
        '<span class="repo-stat">⑂ ' + r.forks + '</span>' +
        (updated ? '<span class="repo-stat repo-stat--date">' + esc(updated) + '</span>' : '') +
        '</div>' +
        '<a href="' + esc(r.url) + '" class="project-link" target="_blank" rel="noopener noreferrer">View source <span aria-hidden="true">→</span></a>' +
        '</article>'
      );
    }).join('');
  }

  function initRepoFeed() {
    var containers = document.querySelectorAll('[data-repos-source], [data-gitlab-user], [data-github-user]');
    if (!containers.length) return;

    containers.forEach(function (el) {
      var source = el.getAttribute('data-repos-source') || 'both';
      var perPage = parseInt(el.getAttribute('data-per-page') || '100', 10);
      var homeLimit = parseInt(el.getAttribute('data-home-limit') || '0', 10);
      var excludeForks = el.getAttribute('data-exclude-forks') !== 'false';
      var excludeArchived = el.getAttribute('data-exclude-archived') !== 'false';
      var sortBy = el.getAttribute('data-sort-by') || 'updated';
      var mode = el.getAttribute('data-mode') || 'cards';

      var githubCfg = {
        enabled: el.getAttribute('data-github-enabled') !== 'false',
        username: el.getAttribute('data-github-user') || '',
        token: el.getAttribute('data-github-token') || '',
        perPage: perPage,
        exclude: el.getAttribute('data-github-exclude') || '',
        pinned: el.getAttribute('data-github-pinned') || '',
        excludeForks: excludeForks,
        excludeArchived: excludeArchived
      };

      var gitlabCfg = {
        enabled: el.getAttribute('data-gitlab-enabled') !== 'false',
        username: el.getAttribute('data-gitlab-user') || '',
        host: el.getAttribute('data-gitlab-host') || 'https://gitlab.com',
        token: el.getAttribute('data-gitlab-token') || '',
        perPage: perPage,
        exclude: el.getAttribute('data-gitlab-exclude') || '',
        pinned: el.getAttribute('data-gitlab-pinned') || '',
        excludeForks: excludeForks,
        excludeArchived: excludeArchived
      };

      var fetchGithub = (source === 'github' || source === 'both') && githubCfg.enabled && githubCfg.username;
      var fetchGitlab = (source === 'gitlab' || source === 'both') && gitlabCfg.enabled && gitlabCfg.username;

      if (!fetchGithub && !fetchGitlab) {
        el.innerHTML = '<div class="repo-empty"><p>No repository source configured. Set <code>github.username</code> and/or <code>gitlab.username</code> in <code>_config.yml</code>.</p></div>';
        return;
      }

      var promises = [];
      if (fetchGithub) promises.push(fetchGitHubRepos(githubCfg));
      if (fetchGitlab) promises.push(fetchGitLabRepos(gitlabCfg));

      Promise.all(promises).then(function (results) {
        var allItems = [];
        var errors = [];
        results.forEach(function (res) {
          allItems = allItems.concat(res.items);
          if (res.error) errors.push(res.error);
        });

        var sorted = sortRepos(allItems, sortBy);
        var display = (mode === 'rows' && homeLimit > 0) ? sorted.slice(0, homeLimit) : sorted;

        if (display.length === 0 && errors.length > 0) {
          el.innerHTML =
            '<div class="repo-empty">' +
            '<p class="repo-error-title">Unable to reach the repository index.</p>' +
            '<p class="repo-error-detail">' + errors.map(function (e) { return esc(e.source + ': ' + e.message); }).join('<br>') + '</p>' +
            '</div>';
          return;
        }

        renderRepos(el, display, mode);

        var toolbar = document.getElementById('repo-toolbar');
        var countEl = document.getElementById('repo-count');
        if (toolbar && mode === 'cards') {
          toolbar.hidden = false;
          if (countEl) {
            countEl.textContent = display.length + ' repositories';
          }
          toolbar.querySelectorAll('.repo-filter').forEach(function (btn) {
            btn.addEventListener('click', function () {
              toolbar.querySelectorAll('.repo-filter').forEach(function (b) {
                b.classList.remove('is-active');
                b.setAttribute('aria-selected', 'false');
              });
              btn.classList.add('is-active');
              btn.setAttribute('aria-selected', 'true');
              var filter = btn.getAttribute('data-filter');
              el.querySelectorAll('[data-source]').forEach(function (card) {
                card.style.display = (filter === 'all' || card.getAttribute('data-source') === filter) ? '' : 'none';
              });
              if (countEl) {
                var visible = el.querySelectorAll('[data-source]:not([style*="display: none"])').length;
                countEl.textContent = visible + ' repositories';
              }
            });
          });
        }
      });
    });
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHeaderScroll();
    initClock();
    initConsole();
    initReveal();
    initSkillBars();
    initRepoFeed();
  });
})();
