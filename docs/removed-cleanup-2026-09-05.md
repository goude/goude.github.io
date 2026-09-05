# Cleanup: pre-reorg surface removed — 2026-09-05

The site went through a reorg that moved everything from before it onto an
`/archive` page, keeping the old pages live at their original URLs. This
change retires that whole surface. Git history is the archive now; nothing
below stays reachable on the web.

Recover any of it from the commit immediately before this file was added
(`git log -- <path>`, then `git show <hash>:<path>`).

## Removed

- **`/archive`** — the archive index and its `NOTES.md` page.
- **`/ai-generated/*`** — all 17 pages (essays, visualizers, learning toys)
  and their backing assets under `public/` (audio, scores, standalone HTML
  tools, the MuseJazz and DSEG fonts, `placeholder.svg`, the
  `code/preprompts` texts). One exception: `toppen-fjaderhjalmar` survives,
  rebuilt from scratch as a minimal page at `/v/toppen-fjaderhjalmar/` —
  just the poem and the video, no tabs.
- **`/docs`** — the in-site docs browser and the `docs/standards/*` +
  `backlog.md` markdown it rendered. Superseded by `CODING.md` and each
  repo's own files.
- **`/cop`, `/egghunt`, `/hello`** — standalone micro-tools and the old
  landing page, plus their backing scripts.
- **The old `Layout` design system** — header, footer, theme toggle,
  logo-swatch build tooling, and the `et-book` font. Everything left uses
  `PaperLayout`, including `404` now; the site lost its dark-mode toggle as
  a result (the paper design is light-only).
- **Orphaned code and dependencies** — `Md.astro`, `CodeBlock.astro`,
  `renderMarkdown.ts`, `utils/docs.ts`, and the `marked`, `shiki`,
  `postcss`, `postcss-custom-properties`, `fast-xml-parser`,
  `fast-xml-builder`, and `@types/youtube` dependencies, all of which
  existed only to render or build the removed pages.

## Why

The reorg's promise was that demoting old content off the main nav was
enough. It wasn't: the pages still shipped, still needed fonts and
dependencies, and still had to be reasoned about on every change. Deleting
them makes the live site equal to what's actually maintained — notes,
essays, and the index. The work isn't lost; it's one `git show` away.

## What stays

The paper design (index, notes, essays), its four fonts, the build/lint/test
tooling, CI, and the 404 page. See the repo root for current structure.
