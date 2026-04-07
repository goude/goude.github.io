# Backlog

Last reviewed 2026-04-07.

## Medium Priority

### Write human-authored content for index and hello pages

`src/pages/index.astro` and `src/pages/hello.astro` are currently "under
construction" placeholders. The old AI-generated versions have been archived at
`src/pages/ai-generated/old-entry-point.astro` and
`src/pages/ai-generated/old-hello.astro`.

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
- **Type external CDN scripts** — added ambient module declaration
  `_regions.d.ts` for the WaveSurfer RegionsPlugin CDN URL; removed
  `@ts-expect-error` and inline casts from `_score.ts`.
- **Add Lighthouse CI to GitHub Actions** — added `lighthouse` job to
  `astro.yml` (runs after build, uses `@lhci/cli`); added `.lighthouserc.json`
  with accessibility error threshold and performance/SEO/best-practices warnings.
