all: build

build: resources/docs.js

resources/docs.js: src
	@cp -r ./src/vendor/client/*.js ./lib/client/
	@cat ./lib/client/zepto.min.js > docs.js.tmp
	@cat ./lib/client/underscore-min.js >> docs.js.tmp
	@cat ./lib/client/docs.js >> docs.js.tmp
	@./node_modules/.bin/uglifyjs --overwrite docs.js.tmp
	@mv docs.js.tmp ./resources/docs.js

test:
	@./node_modules/.bin/nodeunit test

pages:
	@./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco resources/docs.css
	@cd ./examples/bootstrap && ../../bin/styledocco -n "Twitter Bootstrap" less/buttons.less

.PHONY: build test pages examples
