# goude.se

Personal site built with Astro 5 and TypeScript.

## Stack

- **Framework**: Astro 5
- **Language**: TypeScript (strict mode)
- **Styling**: Tufte-inspired CSS, et-book fonts
- **Deploy**: GitHub Pages

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
just preview
```

Run `just` with no arguments to list all available recipes.

## Project Structure

```
src/
├── components/     # Reusable Astro components
├── layouts/        # Page layouts
├── pages/          # File-based routing
├── styles/         # Global CSS
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Features

- Dark/light theme with system preference detection
- ISO week display (Swedish standard)
