BROWSER = opera

all: resources/docs.js

test:
	@./node_modules/.bin/nodeunit test

test-browser: test-browser/tests.js
	@$(BROWSER) test-browser/test.html

test-browser/tests.js: test/
	@./node_modules/.bin/browserify test-browser/browserify-entry.js \
		-o test-browser/tests.js

pages:
	@./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples: resources/docs.js
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include resources/previews.css resources/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less/buttons.less

lint:
	@./node_modules/.bin/jshint styledocco.js cli.js resources/ bin/

resources/docs.js: resources/docs-browserify.js
	@npm install -d
	@./node_modules/.bin/browserify resources/docs-browserify.js \
		| ./node_modules/.bin/uglifyjs -o resources/docs.js
	
.PHONY: all test test-browser pages examples lint
