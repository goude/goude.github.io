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

# ✅ Full check: lint → format-check → typecheck → build
check: lint format-check typecheck build

# ▶️ Start dev server
dev:
    npm run dev

# 🔍 Lint
lint:
    npm run lint

# 🔍 Type check (tsc only)
typecheck:
    npm run typecheck

# 🔨 Build for production
build:
    npm run build

# 👁️ Preview production build
preview:
    npm run preview

# ✨ Format code (writes changes)
format:
    npm run format

# 🔎 Verify formatting (non-destructive)
format-check:
    npm run format:check

# 🧪 Pre-commit hook target
precommit:
    npm run precommit

# 🚀 Pre-push hook target
prepush:
    npm run prepush

# 🧹 Clean build artifacts
clean:
    rm -rf dist node_modules/.cache .astro

# 🧹 Full reset
reset: clean
    rm -rf node_modules/

# Repomix
repomix:
    repomix --ignore "coverage/,node_modules/,public/fonts,src/pages/egghunt.astro"

# Synchronize SVG Colors
svg-sync THEME="light":
    node scripts/sync-svg-swatches.mjs --verbose {{THEME}}