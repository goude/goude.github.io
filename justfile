# Load .env and use a safe shell
set dotenv-load := true
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Config (override via env/.env)
NODE_ENV := env("NODE_ENV", "development")
PORT := env("PORT", "4321")
NODE_REQUIRED := env("NODE_REQUIRED", "v22")

# 🚀 Show banner + task list
_default:
	@echo "🚀 Run 'just quickstart' to get going\n"
	@just --list

# 🚀 Install → check → dev
quickstart: install check dev-serve

# ▶️ Start dev server
dev-serve:
	NODE_ENV={{NODE_ENV}} npm run start

# 🩺 Static checks (astro check)
check: clean format
	npm run astro check

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

# 🔧 Verify Node toolchain
verify:
	@command -v node >/dev/null || { echo "❌ node not found" >&2; exit 127; }
	@command -v npm  >/dev/null || { echo "❌ npm not found" >&2; exit 127; }

# 📦 Install deps
install: verify
	npm ci

# Install playwright
install-playwright:
	npx playwright install --with-deps

# ♻️ Deep clean + reinstall + check
reset: clean install check
	rm -rf node_modules/ package-lock.json

