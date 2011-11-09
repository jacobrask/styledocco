A streamlined project documentation static site generator based on [Docco](http://jashkenas.github.com/docco/). Husky because it's bigger and more irregular than Docco, like [Husky](http://www.wisegeek.com/what-is-a-husky-size-in-clothing.htm) Jeans.

A fork of [Docco](http://jashkenas.github.com/docco/), intended to go beyond the appropriate scope of Docco itself. Forked because Docco itself is pretty simple and this is intended to diverge quite a big. The initial fork included merged pull requests from [nevir](https://github.com/nevir) and j[swartwood](https://github.com/jswartwood) for their work on supporting recursive directories and an improved "Jump To" menu.

Installation
------------
Docco requires [Pygments](http://pygments.org/) to be installed and will try to install it if it's not already. 
Perl is required for [cloc](http://cloc.sourceforge.net/)

To install docco-husky via npm:

	npm install docco-husky

Generate docs like this:

	./node_modules/docco-husky/bin/generate -name "My Project Name" app.js lib public

Generated docs will be created in ./docs

