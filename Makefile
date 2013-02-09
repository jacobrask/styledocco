GRUNT := ./node_modules/grunt/bin/grunt

all: build

build:
	@$(GRUNT)

build-dev:
	@$(GRUNT) dev

lint:
	$(GRUNT) lint

.PHONY: all build lint
