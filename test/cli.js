'use strict';

var htmlFilename = require('../cli.js').htmlFilename;
var menuLinks = require('../cli.js').menuLinks;

buster.testCase("Static file builder", {
  "HTML filenames": function() {
    assert.equals(htmlFilename('bar/baz/foo/bar.css', 'bar/baz'), 'foo-bar.html');
    assert.equals(htmlFilename('foo/bar.css', 'foo/bar.css'), 'bar.html');
    assert.equals(htmlFilename('foo/readme.md', 'foo/readme.md'), 'readme.html');
  },
  "Link objects from paths": function() {
    var links = menuLinks([ 'a/a.css', 'a/b.css', 'a/c/d.css' ], 'a');
    assert.equals(links, { './': [ { name: 'a', href: 'a.html', directory: './' },
                                  { name: 'b', href: 'b.html', directory: './' } ],
                             c: [ { name: 'd', href: 'c-d.html', directory: 'c' } ] });
  }
});
