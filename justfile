# Load .env and use a safe shell
set dotenv-load := true
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Config (override via env/.env)
NODE_ENV := env("NODE_ENV", "development")
PORT := env("PORT", "4321")
NODE_REQUIRED := env("NODE_REQUIRED", "v20")

# 🚀 Show banner + task list
_default:
	@echo "🚀 Run 'just quickstart' to get going\n"
	@just --list

# 🚀 Install → check → dev
quickstart: verify install check dev-serve

# ▶️ Start dev server
dev-serve:
	NODE_ENV={{NODE_ENV}} npm run start

# 🏗️ Production build
build: verify
	npm run build

# 🔎 Preview production build
preview:
	NODE_ENV=production npm run preview -- --port {{PORT}}

# ✨ Format code
format:
	npm run format

# 🧼 Lint code
lint:
	npm run lint

# 🩺 Static checks (astro check)
check:
	npm run astro check

# ✅ Run test suite
test: clean check
	node test/fileUniqueness.js
	npx playwright test

# 🖥️ Playwright UI
test-ui:
	npx playwright test --ui

# 🧹 Clean build artifacts
clean:
	rm -rf dist/ test-results/ .astro/

# ♻️ Deep clean + reinstall + check
reset: clean
	rm -rf node_modules/ package-lock.json
	npm ci
	npx playwright install --with-deps
	just check

# 🔧 Verify Node toolchain
verify:
	@command -v node >/dev/null || { echo "❌ node not found" >&2; exit 127; }
	@command -v npm  >/dev/null || { echo "❌ npm not found" >&2; exit 127; }
	@case "$$(node -v)" in {{NODE_REQUIRED}}*) ;; *) echo "❌ Need Node {{NODE_REQUIRED}}" >&2; exit 1 ;; esac

# 📦 Install deps
install: verify
	npm ci

# 🤖 Local CI pipeline
ci: clean install check lint format build test
