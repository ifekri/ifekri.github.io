# Changelog

All notable changes to iFekri are documented in this file.

## [1.1.0] — 2026-08-10

### Added
- Dual repository feed: GitHub **and** GitLab public APIs
- Source filter toolbar on the Projects page (All / GitHub / GitLab)
- Pinned repos support for both providers
- Exclude list for forks, archived repos, and named repos
- Sort by `updated`, `stars`, or `name`
- Optional token support for higher rate limits
- Professional public-release README, CONTRIBUTING, and LICENSE
- Complete GitHub Actions workflow for Pages deployment

### Changed
- `_config.yml` restructured with a unified `repos` block
- Homepage and Projects page now emit multi-source data attributes
- `main.js` rewritten to normalize GitHub and GitLab responses into one model

## [1.0.0] — 2026-08-02

### Added
- Initial iFekri release
- Operator console hero
- Blog with categories and tags
- GitLab-only repository feed
- GitHub Pages and GitLab Pages pipelines
