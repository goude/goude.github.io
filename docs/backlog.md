# Backlog

Last reviewed 2026-04-02.

## Medium Priority

### Split large components

Header.astro is 690 lines. Extract SVG logo, theme toggle, and nav into sub-components.

- File: `src/components/Header.astro`
- File: `src/pages/ai-generated/opening-the-hood/index.astro` (1,551 lines)

### Extract large inline scripts

Several pages have 100-260 line inline `<script>` blocks that could live in separate files.

- File: `src/components/Header.astro` (lines 548-690 — theme/mode toggle, menu, icon rotation)
- File: `src/pages/cop.astro` (lines 53-313 — QR generation, clipboard, encryption)
- File: `src/pages/egghunt.astro` (lines 580-700+ — decryption, puzzle UI)

### Replace magic numbers with named constants

Animation durations (30s) and max-heights (420px) in content.css should be CSS custom properties.

- File: `src/styles/content.css`

## Low Priority

### Resolve TODO comments

Several pages contain `TODO: rewrite the ai slop` comments. `no-bullshit/index.astro` has multiple `<!-- TODO -->` placeholders for visual descriptions and process steps.

- File: `src/pages/index.astro`
- File: `src/pages/hello.astro`
- File: `src/pages/notes.astro`
- File: `src/pages/ai-generated/ambient-improvement-positive-residue.astro`
- File: `src/pages/ai-generated/no-bullshit/index.astro`

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

## Simplifications

Opportunities to reduce complexity without changing behavior.

### Inline trivial npm script wrappers

The justfile delegates to `npm run` for most recipes. Where the npm script is a single command (e.g. `"lint": "eslint ."`), the justfile recipe could call the tool directly, removing a layer of indirection.

### Simplify cop.astro inline script

The 260-line inline script handles QR generation, clipboard, and encryption. Breaking it into smaller functions or a separate module would improve readability.

- File: `src/pages/cop.astro`

## Improvements

### Consider bundling WaveSurfer and YouTube API

Loading these from CDN introduces external dependencies. Bundling via npm would give type safety, version pinning, and tree-shaking.

- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`
