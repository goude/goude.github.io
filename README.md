# goude.se

Personal site, live at <https://goude.se>, built with Astro 7 and TypeScript.

## Stack

- **Framework**: Astro 7
- **Language**: TypeScript (strict mode)
- **Styling**: paper-themed CSS (light only), self-hosted IM Fell English, IM Fell English SC, Special Elite and Caveat
- **Tests**: Vitest
- **Deploy**: GitHub Actions to GitHub Pages, on push to `main`

## Site

| URL       | Source               | What                                      |
| --------- | -------------------- | ----------------------------------------- |
| `/`       | `src/pages/index.md` | Home, a markdown page                     |
| `/index`  | `src/pages/index/`   | Table of contents, A-to-Z of all pages    |
| `/pages`  | `src/pages/pages/`   | Standing pages                            |
| `/notes`  | `src/pages/notes/`   | Notes                                     |
| `/essays` | `src/pages/essays/`  | Essays                                    |
| `/board`  | `src/pages/board/`   | Corkboard of every entry, links as string |

Add a markdown file with `layout`, `title` and `description` frontmatter to a
section directory and its list picks it up. Every entry also needs `created` and
`updated` (`YYYY-MM-DD`); each section lists newest `updated` first, ties by
title. Initial values came from the file's first git commit, or its file
creation time where it had none.
Home shares `ContentLayout` with the entries in `/pages`, so changes to the page
format reach both.

`/board` reads each entry's source at build time: every internal link
(markdown `](/path)` or HTML `href="/path"`) to another entry becomes a red
string between their cards, drawn client-side so it follows the layout.

Editorial notes are `<aside class="ed" data-ed="ED-n · kind · open">` slips in an
entry's body, styled by `.ed` in `src/styles/paper/base.css`. They render on the
page and may be published; the rules are in `CLAUDE.md`.

## Development

This project uses [`just`](https://github.com/casey/just) as its task runner;
recipes are defined in the `justfile`.

```bash
# Install dependencies (first thing after cloning)
just setup

# Start dev server
just dev

# Full check: format → lint → typecheck → test → build
just check

# Build for production
just build

# Preview production build
just preview   # set PREVIEW_ALLOWED_HOSTS=host1,host2 to reach it from other machines
```

Run `just` with no arguments to list all available recipes.

The site version lives in `package.json`; `astro.config.mjs` reads it and
injects it as `__SITE_VERSION__` (`vite.define`), shown in the footer and as
`<meta name="version">`. Components must not import `package.json`: Astro
restarts the dev server on any change to it, and the import would also send the
browser a reload into that restart, leaving it on a connection error.
`PREVIEW_ALLOWED_HOSTS` is the only environment variable.

Held back on purpose: `prettier-plugin-astro` stays on 0.14 (1.x reflows inline
text and adds visible spaces, as in `</a>.`), and TypeScript stays on 6
(`astro check` and typescript-eslint do not support 7 yet). `minimatch` and
`glob` are overridden in `package.json` to versions without known advisories.

## Project Structure

```
src/
├── components/     # Reusable Astro components
├── layouts/        # Page layouts
├── pages/          # File-based routing
├── styles/         # Global CSS
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
scripts/            # Repo-wide checks, run by Vitest
```
