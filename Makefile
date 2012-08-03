BROWSER = opera

all:

test:
	@./node_modules/.bin/nodeunit test

test-browser: test-browser/tests.js
	@$(BROWSER) test-browser/test.html

test-browser/tests.js: test/
	@./node_modules/.bin/browserify test-browser/browserify-entry.js \
		-o test-browser/tests.js

pages:
	@./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include resources/previews.css --include resources/docs.js resources/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less

lint:
	@./node_modules/.bin/jshint styledocco.js cli.js resources/ bin/

.PHONY: all test test-browser pages examples lint
