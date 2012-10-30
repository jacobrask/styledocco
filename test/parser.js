'use strict';

var buster = require('buster');
var styledocco = require('../styledocco');

buster.testCase("Process stylesheets", {
  "Check type": function() {
    assert.equals(styledocco.checkType("/* foo */"), 'single');
    assert.equals(styledocco.checkType("// foo"), 'single');
    assert.equals(styledocco.checkType("/* foo"), 'multistart');
    assert.equals(styledocco.checkType("foo */"), 'multiend');
    assert.equals(styledocco.checkType("foo"), 'code');
    assert.equals(styledocco.checkType(" /* foo"), 'code');
    assert.equals(styledocco.checkType(" // foo"), 'code');
  },
  "Get comments": function() {
    assert.match(
      styledocco.getComments("/* Foo \n bar */\nbody { background: red }"),
      "Foo \n bar"
    );
    assert.match(
      styledocco.getComments("/* Foo */\nbody { background: red }\n/* Bar */").trim(),
      "Foo \n\n Bar"
    );
    assert.match(
      styledocco.getComments("/* Foo */\nbody { background: red }\n /* Bar */"),
      "Foo",
      "Ignore comments with leading space"
    );
  }
});
