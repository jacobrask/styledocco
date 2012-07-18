BROWSER = opera

all: resources/docs.js

test:
	@./node_modules/.bin/nodeunit test

test-browser: test-browser/tests.js
	@$(BROWSER) test-browser/test.html

test-browser/tests.js: test/
	@./node_modules/.bin/browserify test-browser/browserify-entry.js -o test-browser/tests.js

pages:
	@./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco resources/docs.css
	@cd ./examples/bootstrap && ../../bin/styledocco -n "Twitter Bootstrap" less/buttons.less

lint:
	@./node_modules/.bin/jshint styledocco.js cli.js resources/ bin/

resources/docs.js: resources/docs-browserify.js
	@./node_modules/.bin/browserify resources/docs-browserify.js -o resources/docs.js
	
.PHONY: all test test-browser pages examples lint
