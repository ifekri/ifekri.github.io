# Contributing to iFekri

Thanks for your interest in improving iFekri. This template is intentionally small and self-contained; contributions should keep it that way.

## Philosophy

- **No build-time JavaScript dependencies.** All interactivity lives in `assets/js/main.js` and runs in the browser.
- **No external CSS frameworks.** The design system lives entirely in `assets/css/style.css`.
- **Accessible by default.** Any new feature must respect `prefers-reduced-motion`, semantic HTML, and keyboard navigation.
- **Dark-first.** Light mode is welcome, but the default experience is the operator console aesthetic.

## How to contribute

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes.
4. Test locally with `bundle exec jekyll serve --livereload`.
5. Commit with a clear message and open a pull request.

## Reporting issues

Open an issue with:

- Jekyll version (`bundle exec jekyll --version`)
- Ruby version (`ruby --version`)
- Browser and OS
- Steps to reproduce

## Pull request checklist

- [ ] Site builds without errors
- [ ] No new runtime dependencies added
- [ ] Dark theme remains functional
- [ ] `prefers-reduced-motion` still respected
- [ ] README updated if behavior changes
- [ ] No secrets or tokens committed

## Code style

- HTML: 2-space indentation, no tabs
- CSS: 2-space indentation, CSS custom properties for theming
- JS: 2-space indentation, ES5-compatible where possible for broad browser support

Thanks again for helping keep iFekri sharp.
