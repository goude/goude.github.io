# Load .env automatically
set dotenv-load := true
# Safer shell defaults
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Configuration defaults (override via exported env or .env)
NODE_ENV := env("NODE_ENV", "development")
PORT := env("PORT", "4321")
NODE_REQUIRED := env("NODE_REQUIRED", "v20")

# 🚀 Quickstart + task index (run `just` with no args)
core-help:
	@printf "🚀 Quickstart\n"
	@printf "  1) just core-quickstart   # verify tools, install deps, check, then start dev\n"
	@printf "  2) just dev-start         # start dev server (subsequent runs)\n"
	@printf "  3) just dev-build && dev-preview  # build and preview production\n\n"
	@printf "Env  NODE_ENV={{NODE_ENV}}  PORT={{PORT}}  NODE_REQUIRED={{NODE_REQUIRED}}\n\n"
	@printf "📜 Available tasks\n\n"
	@just --list

# 🧭 Bootstrap project and start dev server
core-quickstart: deps-verify-tools deps-install qa-check
	NODE_ENV={{NODE_ENV}} npm run start

# 📋 Show available tasks (plain list)
core-show:
	@just --list

# 📦 Install project dependencies
deps-install: deps-verify-tools
	npm ci

# 🎭 Install Playwright browsers
deps-playwright-install:
	npx playwright install --with-deps

# 🔧 Verify toolchain (node/npm)
deps-verify-tools:
	@command -v node >/dev/null || { echo "❌ node not found" >&2; exit 127; }
	@command -v npm  >/dev/null || { echo "❌ npm not found" >&2; exit 127; }
	@NODE_VER="$$(node -v)"; \
	case "$$NODE_VER" in \
	  {{NODE_REQUIRED}}*) ;; \
	  *) echo "❌ Expected Node {{NODE_REQUIRED}} (got $$NODE_VER)" >&2; exit 1 ;; \
	esac

# 🧹 Clean build/test artifacts
clean:
	rm -rf dist/ test-results/ .astro/

# 🧨 Deep clean (includes node_modules)
dev-deep-clean: clean
	rm -rf node_modules/ package-lock.json

# ▶️ Start dev server
dev-start: qa-check
	NODE_ENV={{NODE_ENV}} npm run start

# 🏗️ Build production site
dev-build: deps-verify-tools
	npm run build

# 🔎 Preview production build
dev-preview:
	NODE_ENV=production npm run preview -- --port {{PORT}}

# ♻️ Reset: deep clean → install → playwright → check
dev-reset: dev-deep-clean deps-install deps-playwright-install qa-check
	@printf "✅ Reset complete. Next: run 'just dev-start' or 'just core-quickstart'.\n"

# ✨ Format code
qa-fmt:
	if npm run | grep -qE '^[[:space:]]*fmt([[:space:]]|:)'; then npm run fmt; \
	elif npm run | grep -qE '^[[:space:]]*format([[:space:]]|:)'; then npm run format; \
	else npx prettier -w .; fi

# 🧼 Lint code
qa-lint:
	if npm run | grep -qE '^[[:space:]]*lint([[:space:]]|:)'; then npm run lint; \
	else printf "ℹ️ No lint script found; skipping.\n"; fi

# 🩺 Static checks (astro check)
qa-check:
	npm run astro check

# ✅ Test suite
qa-test: clean qa-check
	node test/fileUniqueness.js
	npx playwright test

# 🖥️ Test UI (Playwright)
qa-test-ui:
	npx playwright test --ui

# 🧪 CI pipeline (local)
qa-ci: clean deps-install qa-check qa-lint qa-fmt dev-build qa-test


# ────────────────────────────────────────────────────────────────────────────
# Notes for future maintainers (and helpful LLMs)
# ────────────────────────────────────────────────────────────────────────────
# Grouping & naming:
#   - Word prefixes so alphabetical `just --list` clusters tasks:
#       core-* (meta/entry), deps-* (tooling), dev-* (build/run/clean), qa-* (checks/tests).
# UX:
#   - First recipe `core-help` runs on bare `just`, prints a minimal guide,
#     current env, and then calls `just --list` (no fancy quoting; portable).
# Docstrings:
#   - The single-line comment immediately above each recipe shows in `just --list`.
# Env:
#   - Defaults via env("KEY","default") so exported vars and `.env` override cleanly.
# Shell:
#   - Bash with -eu and pipefail for predictable failure behavior.
# Portability:
#   - Avoids `$'...'` strings and nested command substitution in help to keep it tmux/fish-friendly.
# Extend:
#   - Add `release-*`, `docs-*`, or argumented recipes as needed; document usage in the doc-comment.
