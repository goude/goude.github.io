set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load := true

export PATH := "./node_modules/.bin:" + env("PATH")

_default:
    @printf "After cloning: run just setup\n\n"
    @just --list

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Core workflow
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 📦 Install dependencies (first thing after cloning)
setup:
    npm install

# ✅ Full check: fmt → lint → typecheck → test → build
check: format-check lint typecheck test build

# ▶️ Start dev server
dev:
    astro dev

# 🔍 Lint
lint:
    eslint . --ext .ts,.astro --max-warnings=0

# 🔍 Type check (tsc only)
typecheck:
    tsc --noEmit

# 🔨 Build for production
build:
    astro check && astro build

# 👁️ Preview production build
preview:
    astro preview

# ✨ Format code (writes changes)
format:
    prettier --write .

# 🔎 Verify formatting (non-destructive)
format-check:
    prettier --check .

# 🧪 Run unit tests
test:
    vitest run

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

# 📦 Bundle repo snapshot for LLM context (excludes secrets and large files)
repomix:
    repomix --ignore "coverage/,node_modules/,public/fonts,src/pages/egghunt.astro"

# 🎨 Synchronize SVG fill colors to match the active theme palette (default: light)
svg-sync THEME="light":
    node scripts/sync-svg-swatches.mjs --verbose {{THEME}}