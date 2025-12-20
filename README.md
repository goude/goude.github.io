# goude.se

Personal site built with Astro 5 and TypeScript.

## Stack

- **Framework**: Astro 5
- **Language**: TypeScript (strict mode)
- **Styling**: Tufte-inspired CSS, et-book fonts
- **Deploy**: GitHub Pages

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```

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
