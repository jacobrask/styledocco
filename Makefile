BROWSER = opera

all:

test:
	@./node_modules/.bin/buster test

examples:
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include share/previews.css --include share/docs.ui.js share/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less

lint:
	@./node_modules/.bin/jshint styledocco.js cli.js share/ bin/ test/

.PHONY: all test examples lint
