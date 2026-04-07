# Backlog

Last reviewed 2026-04-07.

## Medium Priority

### Write human-authored content for index and hello pages

`src/pages/index.astro` and `src/pages/hello.astro` are currently "under
construction" placeholders. The old AI-generated versions have been archived at
`src/pages/ai-generated/old-entry-point.astro` and
`src/pages/ai-generated/old-hello.astro`.

## Low Priority

### Type external CDN scripts

`_score.ts` uses `@ts-expect-error` for a CDN ESM import of the WaveSurfer
regions plugin. Consider bundling these dependencies or adding typed wrappers.

- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`

### Add RSS feed

Blog-like content would benefit from `@astrojs/rss`.

### Add Lighthouse CI to GitHub Actions

No performance budget exists. Lighthouse CI in the workflow would catch regressions.

- File: `.github/workflows/astro.yml`

## Improvements

### Consider bundling WaveSurfer and YouTube API

Loading these from CDN introduces external dependencies. Bundling via npm would give type safety, version pinning, and tree-shaking.

- File: `src/pages/ai-generated/do-olls-that-will-talk/_score.ts`

## Completed

- **Remove ModeToggle component** — `ModeToggle.astro` deleted, `data-mode-*` CSS
  removed, `nav.css` comment updated.
- **Clean up entry-point hero image CSS** — `#entry-point figure` cinematic hero
  rules removed from `content.css`.
- **Reduce large content pages** — `patch-learn`, `beat-learn`, and
  `thread-taxonomy` each refactored from monolithic `.astro` files into
  sub-component directories (index + partials, all under 150 lines each).
- **Inline trivial npm script wrappers** — justfile recipes already call tools
  directly (`eslint`, `tsc`, `astro`, `prettier`, `vitest`); only `precommit`
  and `prepush` delegate to npm because they run multi-step pipelines.
