# CLAUDE.md

## Session Discipline

- Never write >150 lines in a single tool call
- For files >100 lines: create skeleton first, fill sections in subsequent edits
- Never retry a timed-out operation identically — break it smaller
- On interrupt: stop immediately, commit partial work, then reassess
- After any file edit, re-read before editing again (stale context kills diffs)

## Boundaries

| Module      | May import from                       | Must NOT import from          |
| ----------- | ------------------------------------- | ----------------------------- |
| components/ | layouts/, utils/, types/              | pages/                        |
| layouts/    | components/, utils/, types/           | pages/                        |
| pages/      | components/, layouts/, utils/, types/ |                               |
| utils/      | types/                                | components/, layouts/, pages/ |
| types/      | (stdlib only)                         | everything else               |
| styles/     | (standalone CSS)                      | n/a                           |

## Ownership

- `src/components/` — reusable Astro components (BaseHead, Header, Footer, Layout, Md, CodeBlock)
- `src/layouts/` — page layout wrappers
- `src/pages/` — routes; each file or directory = one URL
- `src/pages/docs/` — auto-generated from `docs/` markdown files
- `src/utils/` — pure functions and build-time helpers
- `src/types/` — shared TypeScript interfaces
- `src/styles/` — global CSS (reset, base, vars, fonts, content)
- `scripts/` — standalone Node scripts called from justfile
- `docs/` — project documentation, rendered at `/docs` on the site
- `docs/standards/` — reusable conventions (not project-specific)

## Before Finishing

Run `just check` (which runs lint → format-check → typecheck → build). Zero warnings.

## Large Files

Target: <500 lines per file.

| File                                     | Lines | Strategy                             |
| ---------------------------------------- | ----- | ------------------------------------ |
| src/components/Header.astro              | 690   | Extract SVG logo, theme toggle, nav  |
| src/pages/t/opening-the-hood/index.astro | 1551  | Extract sections into sub-components |

## Diffs

Minimal diffs. Refactor only for: correctness, safety, performance cliffs,
or structural breakage risk. Do not rename, reformat, or reorganise code
outside the current task.

## Stack

- Astro 5, TypeScript (strict), Prettier, ESLint
- Styling: Tufte-inspired CSS, et-book fonts, CSS custom properties
- Markdown: marked + Shiki (dual light/dark themes)
- Build: `just check` → format-check → lint → typecheck → build
- Deploy: GitHub Actions → GitHub Pages (goude.se)
- Dependencies: `npm install`, no other package managers

## Reference

- Development principles: CODING.md
- Backlog: docs/backlog.md
- Standards: docs/standards/
