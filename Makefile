BUSTER := ./node_modules/.bin/buster
GRUNT := ./node_modules/grunt/bin/grunt

all: build

build:
	@$(GRUNT)

test-server:
	@$(BUSTER)-server

test:
	@$(BUSTER)-test
	@$(BUSTER)-test --browser

examples: build
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include share/previews.css --include lib/docs.js share/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less

lint:
	$(GRUNT) lint

.PHONY: all build test examples lint
