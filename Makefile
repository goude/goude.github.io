.PHONY: clean test check serve

clean:
	rm -rf dist/ test-results/

check:
	npm run astro check

test: clean check
	node test/fileUniqueness.js
	npx playwright test

serve:
	npm run start
