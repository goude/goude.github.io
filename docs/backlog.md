# Backlog

Last reviewed 2026-04-06.

## High Priority

### Remove ModeToggle component

`ModeToggle.astro` is no longer used — the detail-levels toggle was removed from
the header. The component file and its `data-mode-*` CSS can be deleted. Also
update the `nav.css` comment that still references it.

- File: `src/components/ModeToggle.astro`
- File: `src/styles/nav.css` (line 2 comment)

### Clean up entry-point hero image CSS

`content.css` contains cinematic hero-image rules for `#entry-point figure`.
The current `index.astro` is a minimal placeholder with no figures — these rules
only serve the archived `old-entry-point.astro`. Remove them once the archived
page is deleted or the new index page is finalized.

- File: `src/styles/content.css` (lines 318-390)

## Medium Priority

### Write human-authored content for index and hello pages

`src/pages/index.astro` and `src/pages/hello.astro` are currently "under
construction" placeholders. The old AI-generated versions have been archived at
`src/pages/ai-generated/old-entry-point.astro` and
`src/pages/ai-generated/old-hello.astro`.

### Reduce large content pages

Several AI-generated content pages exceed the 500-line target:

| File                                           | Lines |
| ---------------------------------------------- | ----- |
| `src/pages/ai-generated/patch-learn.astro`     | 771   |
| `src/pages/ai-generated/beat-learn.astro`      | 735   |
| `src/pages/ai-generated/thread-taxonomy.astro` | 532   |

These could be split into sub-components following the pattern used by
`opening-the-hood/` (which was successfully split from 1,551 into a 143-line
index plus partial components).

## Low Priority

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

## Improvements

### Consider bundling WaveSurfer and YouTube API

Loading these from CDN introduces external dependencies. Bundling via npm would give type safety, version pinning, and tree-shaking.

- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`
