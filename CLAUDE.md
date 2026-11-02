# CLAUDE.md

## Public Repo

This repo and its history are public. Everything written here, commit messages
included, stays about this site: no machines, hostnames, addresses, private
projects, personal tooling or working arrangements behind it. Editorial notes
render on the page, so the same applies to them.

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

- `src/components/` — reusable Astro components (BaseHead, Breadcrumbs, Lightbox, NoteCard, PaperHeader, PaperFooter)
- `src/layouts/` — page layout wrappers: `PaperLayout` (everything, 404 included), `ContentLayout` (markdown pages/notes/essays only, wraps `PaperLayout`)
- `src/pages/` — routes; each file or directory = one URL. `index.md` is Home (`/`), a markdown page like those in `pages/`, sharing their format through `ContentLayout`; `index/` is the table of contents plus an A-to-Z list of every page (`/index`); `board/` is a corkboard of every entry with its internal links as string (`/board`)
- `src/utils/` — pure functions and build-time helpers
- `src/types/` — shared TypeScript interfaces
- `src/styles/` — global CSS (reset, paper/\*)
- `scripts/` — repo-wide checks, run by Vitest

## Before Finishing

Run `just check` (which runs format-check → lint → typecheck → test → build). Zero warnings.

## Code Style

Comments explain why, not what — the code already shows how. Small
functions, flat control flow, early returns. TypeScript strict + ESLint +
Prettier are the source of truth for everything else; don't restate what
they already enforce.

Justfile recipes delegate to the matching npm script (single source of
truth for the actual command) except where there's no npm equivalent
(`clean`, `reset`). One emoji + one-line comment per recipe.

## Content Authorship

All prose on this site is human-written by Daniel. For pages, notes and essays:

- **Front matter is the AI's job.** Keep it true to the content without being
  asked: when a body changes, check `description`, `updated` and `thumb` (bump `updated`
  to the day the body changed; `created` stays). A
  description may only say what the body already says. `title` is Daniel's words:
  suggest a change in a note instead of making it.
- **The content is Daniel's.** Below the front matter, do not write, reword, move
  or delete anything except editorial notes, unless he explicitly says to for
  that change. This covers typos and placeholders too.
- **Editorial notes are the AI's channel.** Review as an editor, in a visible
  slip placed right after the passage it concerns:

  ```html
  <aside class="ed" data-ed="ED-2 · fact · open">
    <q>his exact words</q> The note.
  </aside>
  ```

  - Numbers are stable per file and never reused.
  - Kinds: `fact`, `argument`, `voice`, `structure`, `reader`, `keep`, `meta`.
    `keep` marks what works.
  - `<q>` holds only his exact words; omit it when pointing at something absent.
  - Notes ask and explain. They never offer replacement wording.
  - A note is removed once settled. Styles: `.ed` in `src/styles/paper/base.css`.
  - Notes render on the page and may be published with it (Daniel, 2026-11-02).
    Because they are public, they follow the Public Repo rule above.

Outside pages, notes and essays (listings, the 404, navigation), ask before
writing or rewording anything a visitor would read as the author's voice.

## Diffs

Minimal diffs. Refactor only for: correctness, safety, performance cliffs,
or structural breakage risk. Do not rename, reformat, or reorganise code
outside the current task.

## Stack

- Astro 7, TypeScript (strict), Prettier, ESLint
- Styling: paper-themed CSS, four web fonts, CSS custom properties
- Build: `just check` → format-check → lint → typecheck → test → build
- Deploy: GitHub Actions → GitHub Pages (goude.se)
- Dependencies: `npm install`, no other package managers

## Reference

- Removed-content record: docs/removed-cleanup-2026-09-05.md
