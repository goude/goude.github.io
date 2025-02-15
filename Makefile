.PHONY: clean test

clean:
	rm -rf dist/

test:
	node test/fileUniqueness.js
	npx playwright test
