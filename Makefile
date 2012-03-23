all: build

build:
	coffee -c -o lib src

test:
	nodeunit test

pages:
	./bin/styledocco -n StyleDocco -o ./ --overwrite resources/docs.css

examples:
	./bin/styledocco -n StyleDocco -o ./examples/styledocco --overwrite resources/docs.css
	cd examples/bootstrap && ../../bin/styledocco -n "Twitter Bootstrap" --overwrite less/buttons.less

.PHONY: build test pages examples
