'use strict';

var buster = require("buster");

var fs = require('fs');
var path = require('path');
var styledocco = require('../styledocco');

var readFileSync = function(path) {
  if (typeof window === 'undefined') {
    return fs.readFileSync(path, 'utf8');
  } else {
    var req = new XMLHttpRequest();
    req.open('GET', path, false);
    req.send();
    return req.responseText;
  }
};

var fixturePath;
if (typeof window === 'undefined') {
  fixturePath = path.join(__dirname, '/fixtures/');
} else {
  fixturePath = 'fixtures/';
}
var fixtures = [ 'asterisk.css', 'code.css', 'comments.css', 'invalid.css',
                 'normal.css', 'sections.css', 'structured.css' ];

buster.testCase("Parser", {
  "Documentation and code blocks": function() {
    fixtures.forEach(function(fix) {
      var css = readFileSync(fixturePath + fix);
      var blocks = readFileSync(fixturePath + fix + '.blocks.json');
      var extracted = styledocco.separate(css);
      var saved = JSON.parse(blocks);
      assert.equals(extracted, saved, "Match output with fixture " + fix);
    });
  },
  "Sections": function() {
    fixtures.forEach(function(fix) {
      var css = readFileSync(fixturePath + fix);
      var blocks = readFileSync(fixturePath + fix + '.sections.json');
      var extracted = JSON.parse(JSON.stringify(styledocco(css)));
      var saved = JSON.parse(blocks);
      assert.equals(extracted, saved, "Match output with fixture " + fix);
    });
  }
});
