'use strict';

var htmlFilename = require('../cli.js').htmlFilename;

exports["HTML filename"] = function(test) {
  test.equal(htmlFilename('bar/baz/foo/bar.css', 'bar/baz'), 'foo-bar.html');
  test.equal(htmlFilename('foo/bar.css', 'foo/bar.css'), 'bar.html');
  test.equal(htmlFilename('foo/readme.md', 'foo/readme.md'), 'readme.html');
  test.done();
};

var menuLinks = require('../cli.js').menuLinks;
exports["Link objects from paths"] = function(test) {
  var links = menuLinks([ 'a/a.css', 'a/b.css', 'a/c/d.css' ], 'a');
  test.deepEqual(links, { './': [ { name: 'a', href: 'a.html', directory: './' },
                                  { name: 'b', href: 'b.html', directory: './' } ],
                             c: [ { name: 'd', href: 'c-d.html', directory: 'c' } ] });
  test.done();
};

