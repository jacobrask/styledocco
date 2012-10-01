BUSTER := ./node_modules/.bin/buster
GRUNT := ./node_modules/grunt/bin/grunt

all: build

build:
	@$(GRUNT)

build-dev:
	@$(GRUNT) dev

test-server:
	@$(BUSTER)-server

test:
	@$(BUSTER)-test
	@$(BUSTER)-test --browser

examples: build-dev
	@./bin/styledocco -n StyleDocco -o ./examples/styledocco \
		--include share/previews.css share/docs.css
	@./bin/styledocco -n "Twitter Bootstrap" -o ./examples/bootstrap/docs \
		examples/bootstrap/less

lint:
	$(GRUNT) lint

.PHONY: all build test examples lint
