set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load := true

_default:
    @just --list

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Core workflow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 📦 Install dependencies
install:
    npm install

# ✅ Full check: format → lint → build → test
check: format lint build test

# ▶️ Start dev server
dev-serve:
    npm run dev

# 🧹 Clean build artifacts and caches
clean:
    rm -rf dist node_modules/.cache .astro

# 🧹 Clean everything
reset: clean
    rm -rf node_modules/

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Individual steps
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ✨ Format code
format:
    npm run format

# 🔍 Lint code
lint:
    npm run lint

# 🔨 Build for production
build:
    npm run build

# 🧪 Run tests
test:
    npx playwright test

# 👁️ Preview production build
preview:
    npm run preview

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Quickstart
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 🚀 Bootstrap: install → build → dev server
core-quickstart: install build dev-serve
