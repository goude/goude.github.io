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

- `src/components/` — reusable Astro components (BaseHead, NoteCard, PaperHeader, PaperFooter)
- `src/layouts/` — page layout wrappers: `PaperLayout` (everything, 404 included), `ContentLayout` (markdown notes/essays only, wraps `PaperLayout`)
- `src/pages/` — routes; each file or directory = one URL
- `src/utils/` — pure functions and build-time helpers
- `src/types/` — shared TypeScript interfaces
- `src/styles/` — global CSS (reset, paper/\*)
- `scripts/` — standalone Node scripts called from justfile

## Before Finishing

Run `just check` (which runs lint → format-check → typecheck → build). Zero warnings.

## Content Authorship

All prose on this site (essays, notes, any long-form text) is human-written by
Daniel. AI may restructure, delete, or fix factual/structural content in this
repo freely, but must ask explicit permission before writing or rewording any
prose a visitor would read as the author's voice.

## Diffs

Minimal diffs. Refactor only for: correctness, safety, performance cliffs,
or structural breakage risk. Do not rename, reformat, or reorganise code
outside the current task.

## Stack

- Astro 7, TypeScript (strict), Prettier, ESLint
- Styling: paper-themed CSS, four web fonts, CSS custom properties
- Build: `just check` → format-check → lint → typecheck → build
- Deploy: GitHub Actions → GitHub Pages (goude.se)
- Dependencies: `npm install`, no other package managers

## Reference

- Development principles: CODING.md
- Removed-content record: docs/removed-cleanup-2026-09-05.md
