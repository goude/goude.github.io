set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

export PATH := "./node_modules/.bin:" + env("PATH")

_default:
    @printf "After cloning: run just setup\n\n"
    @just --list

# 📦 Install dependencies (first thing after cloning)
[group('setup')]
setup:
    npm install

# ✅ Full check: fmt → lint → typecheck → test → build
[group('daily')]
check: format-check lint typecheck test build

# ▶️ Start dev server
[group('daily')]
dev:
    npm run dev

# 🔍 Lint
[group('checks')]
lint:
    npm run lint

# 🔍 Type check (tsc only)
[group('checks')]
typecheck:
    npm run typecheck

# 🔨 Build for production
[group('daily')]
build:
    npm run build

# 👁️ Preview production build
[group('daily')]
preview:
    npm run preview

# ✨ Format code (writes changes)
[group('daily')]
format:
    npm run format

# 🔎 Verify formatting (non-destructive)
[group('checks')]
format-check:
    npm run format:check

# 🧪 Run unit tests
[group('checks')]
test:
    npm run test

# 🔗 Check for broken links, internal and external (builds first)
[group('checks')]
links:
    npm run links

# 🧪 Pre-commit hook target
[group('hooks')]
precommit:
    npm run precommit

# 🚀 Pre-push hook target
[group('hooks')]
prepush:
    npm run prepush

# 🧹 Clean build artifacts
[group('maintenance')]
clean:
    rm -rf dist node_modules/.cache .astro

# 🧹 Full reset
[group('maintenance')]
reset: clean
    rm -rf node_modules/

# 📦 Bundle repo snapshot for LLM context (excludes secrets and large files)
[group('maintenance')]
repomix:
    npx repomix --ignore "coverage/,node_modules/,public/fonts"
