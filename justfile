clean:
	rm -rf dist/ test-results/

check:
	npm run astro check

test: clean check
	node test/fileUniqueness.js
	npx playwright test

dev:
	NODE_ENV=dev npm run start

build:
  npm run build
