all: build

build: grunt

test:
	@./node_modules/.bin/buster test

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include share/previews.css --include share/docs.ui.js share/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less

lint:
	grunt lint

.PHONY: all build test examples lint
