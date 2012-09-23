'use strict';

var _ = require('underscore');
var Docu = require('../web/models/documentation');

buster.testCase("Render documentation", {
  setUp: function() {
    this.server = this.useFakeServer();
  },
  tearDown: function() {
    this.server.restore;
  },
  "Process stylesheets": function() {
    var css = "/* Foo */\nbody { background: red }";
    var docu = new Docu({ path: 'foo.css' });
    assert.equals(docu.tokenize(css)[0].type, 'paragraph');
    assert.match(docu.tokenize(css)[0].text, 'Foo');
  },
  "Fetch stylesheets": function(done) {
    var docu = new Docu({ path: 'foo.css' });
    var count = 0;
    docu.on('ready', function() {
      refute.match(docu.get('docs'), "from foo.css");
      if (count++ == 1) done();
    });
    docu.fetch();
    _.invoke(this.server.requests, 'respond',
      200, { 'Content-Type': 'text/css' }, '/* Foo */');
  },
  "Error handling": function(done) {
    var docu = new Docu({ path: 'foo.css' });
    docu.on('error', function() {
      assert.match(docu.get('docs'), "from foo.css");
      done();
    });
    this.server.requests[0].respond(
      404, { 'Content-Type': 'text/plain' }, 'FUUU');
  }
});
