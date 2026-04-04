# Backlog

Last reviewed 2026-04-04.

## Medium Priority

### Remove ModeToggle component

`ModeToggle.astro` is no longer used — the detail-levels toggle was removed from
the header. The component file and its `data-mode-*` CSS can be deleted.

- File: `src/components/ModeToggle.astro`

### Write human-authored content for index and hello pages

`src/pages/index.astro` and `src/pages/hello.astro` are currently "under
construction" placeholders. The old AI-generated versions have been archived at
`src/pages/ai-generated/old-entry-point.astro` and
`src/pages/ai-generated/old-hello.astro`.

### Clean up entry-point hero image CSS

`content.css` still contains the cinematic hero-image treatment for `#entry-point`
figures. Now that `index.astro` is a minimal placeholder, these rules are dead.
Remove or repurpose them when the new index page is written.

- File: `src/styles/content.css` (search for `#entry-point figure`)

### Split large components

`opening-the-hood/index.astro` is 1,551 lines. Extract sections into components or partial Astro files.

- File: `src/pages/ai-generated/opening-the-hood/index.astro`

### Extract large inline scripts

Several pages have 100-260 line inline `<script>` blocks that could live in separate files.

- File: `src/pages/cop.astro` (lines 53-313 — QR generation, clipboard, encryption)
- File: `src/pages/egghunt.astro` (lines 580-700+ — decryption, puzzle UI)

## Low Priority

### Resolve TODO comments

Several pages contain `TODO: rewrite the ai slop` comments. `no-bullshit/index.astro` has multiple `<!-- TODO -->` placeholders for visual descriptions and process steps.

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
