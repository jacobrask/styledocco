'use strict';

var Docu = require('../web/documentation/model');
var DocuView = require('../web/documentation/view');
var DocuCollection = require('../web/documentation/collection');

buster.testCase("Render documentation", {
  setUp: function() {
    this.server = this.useFakeServer();
  },
  tearDown: function() {
    this.server.restore();
  },
  "Process stylesheets": function() {
    // Also see separate parser tests
    var docu = new Docu({ path: 'foo.css' });
    this.server.requests[0].respond(
      200, { 'Content-Type': 'text/css' }, "/* Foo */\nbody { background: red }"
    );
    assert.equals(docu.get('name'), 'foo');
    // For more detailed parser tests, see previews.js
    assert.equals(docu.tokenize()[0].type, 'paragraph');
    assert.match(docu.tokenize()[0].text, 'Foo');
  }
});
