'use strict';

var buster = require('buster');
var Docu = require('../../web/models/documentation');

buster.testCase("Render documentation", {
  "Process stylesheets": function() {
    var css = "/* Foo */\nbody { background: red }";
    var docu = new Docu({ path: 'foo.css' });
    assert.equals(docu.tokenize(css)[0].type, 'paragraph');
    assert.match(docu.tokenize(css)[0].text, 'Foo');
  }
});
