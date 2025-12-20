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

# ✅ Full check: format → check → build
check: format typecheck build

# ▶️ Start dev server
dev:
    npm run dev

# 🔍 Type check
typecheck:
    npm run check

# 🔨 Build for production
build:
    npm run build

# 👁️ Preview production build
preview:
    npm run preview

# ✨ Format code
format:
    npm run format

# 🧹 Clean build artifacts
clean:
    rm -rf dist node_modules/.cache .astro

# 🧹 Full reset
reset: clean
    rm -rf node_modules/
