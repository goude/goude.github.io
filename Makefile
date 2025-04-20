.PHONY: clean test check

clean:
	rm -rf dist/ test-results/

check:
	npm run astro check

test: clean check
	node test/fileUniqueness.js
	NODE_ENV=test npx playwright test
