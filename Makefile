.PHONY: clean test

clean:
	rm -rf dist/ test-results/

test:
	node test/fileUniqueness.js
	npx playwright test
