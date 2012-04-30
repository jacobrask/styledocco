all: build

build:
	./node_modules/.bin/coffee -c -o ./lib ./src
	cp -r ./src/vendor/client/*.js ./lib/client/
	cat ./lib/client/*.js | ./node_modules/.bin/uglifyjs -o ./resources/docs.js

test:
	nodeunit test

pages:
	./bin/styledocco -n StyleDocco -o ./ ./resources/docs.css

examples:
	./bin/styledocco -n StyleDocco -o ./examples/styledocco resources/docs.css
	cd ./examples/bootstrap && ../../bin/styledocco -n "Twitter Bootstrap" less/buttons.less

.PHONY: build test pages examples
