BROWSER = opera

all: build

build: resources/docs.js

shared/ender.js:
	@ender build -o shared/ender.js domready bonzo qwery underscore

resources/docs.js: shared/docs.js shared/ender.js
	@cat shared/ender.js > resources/docs.js
	@cat shared/docs.js >> resources/docs.js

test:
	@./node_modules/.bin/nodeunit test

test-browser: test-browser/tests.js
	@$(BROWSER) test-browser/test.html

test-browser/tests.js:
	@./node_modules/.bin/browserify test-browser/browserify-entry.js -o test-browser/tests.js

pages:
	@./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco resources/docs.css
	@cd ./examples/bootstrap && ../../bin/styledocco -n "Twitter Bootstrap" less/buttons.less

.PHONY: all build test test-browser pages examples
