# Backlog

Code review improvements identified 2026-03-28.

## High Priority

### Sanitize innerHTML in egghunt.astro

`result.innerHTML = html` injects decrypted content without sanitization. Use DOMPurify or `textContent` where possible to prevent XSS.

- File: `src/pages/egghunt.astro`

### Add Subresource Integrity (SRI) to CDN resources

Font Awesome, YouTube IFrame API, and WaveSurfer are loaded without `integrity` attributes. A compromised CDN could inject malicious code.

- File: `src/components/BaseHead.astro`
- File: `src/pages/ai-generated/do-olls-that-will-talk/index.astro`

### Add test coverage

Date utilities and the color-mix resolver are testable pure functions with no tests. Add vitest.

- File: `src/utils/date.ts`
- File: `scripts/sync-svg-swatches.mjs`

## Medium Priority

### Split large components

Header.astro is 690 lines. Extract SVG logo, theme toggle, and nav into sub-components.

- File: `src/components/Header.astro`
- File: `src/pages/ai-generated/opening-the-hood/index.astro` (1,551 lines)

### Replace magic numbers with named constants

Animation durations (30s), max-heights (420px), WaveSurfer width thresholds should be CSS custom properties or named constants.

- File: `src/styles/content.css`
- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`

### Add sitemap, robots.txt, and 404 page

No `sitemap.xml` (use `@astrojs/sitemap`), no `robots.txt`, no custom 404 page.

### Audit image accessibility

Some images are missing `alt` text. The egghunt password input has a placeholder but no `<label>` or `aria-label`.

- File: `src/pages/egghunt.astro`

## Low Priority

### Remove console.error in production pages

`console.error()` calls in cop.astro and egghunt.astro should be removed or gated behind a debug flag.

- File: `src/pages/cop.astro`
- File: `src/pages/egghunt.astro`

### Type external CDN scripts

`_score.ts` uses `@ts-expect-error` for CDN ESM imports. Consider bundling these dependencies or adding typed wrappers.

- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`

### Add RSS feed

Blog-like content would benefit from `@astrojs/rss`.

### Add Lighthouse CI to GitHub Actions

No performance budget exists. Lighthouse CI in the workflow would catch regressions.

- File: `.github/workflows/astro.yml`

## Refactoring

Prioritized structural improvements. Address top-down.

### Extract shared markdown rendering utility

`Md.astro` and `docs/[...slug].astro` duplicate the marked + Shiki dual-theme rendering pipeline. Extract to a shared `renderMarkdown()` function in `src/utils/`.

- File: `src/components/Md.astro`
- File: `src/pages/docs/[...slug].astro`

### Consolidate layout usage

`src/layouts/Layout.astro` and `src/components/Layout.astro` — unclear which is canonical. Audit and collapse to one.

- File: `src/layouts/Layout.astro`

### Extract Header.astro sub-components

Header.astro at 690 lines mixes SVG logo, theme toggle, and navigation. Extract each into its own component.

- File: `src/components/Header.astro`

### Break up opening-the-hood page

At 1,551 lines this is the largest file. Extract sections into components or partial Astro files.

- File: `src/pages/ai-generated/opening-the-hood/index.astro`

### Add CLAUDE.md

Create a project-root LLM instructions file following `docs/standards/llm-instructions-file.md`. Keep under 200 lines.

### Align justfile with conventions

Apply `docs/standards/justfile.md` patterns: rename `install` to `setup`, add `_default` printf hint, ensure `check` ordering is fmt -> lint -> typecheck -> build.
