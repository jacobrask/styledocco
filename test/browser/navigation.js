'use strict';

var doc = document;
var genToC = window.styledocco.generateToC;
var makeToCItem = window.styledocco.generateToC.makeToCItem;
var getElementsByTagNames = window.styledocco.getElementsByTagNames

buster.testCase("Table of Contents", {
  setUp: function() {
    doc.body.innerHTML = '<h1>A</h1><h2>B</h2><p><h1>C</h1><h5>D</h5><h3>E</h3><h1>F</h1>><p>';
  },
  tearDown: function() {
    doc.body.innerHTML = '';
  },
  "Find headings": function() {
    var headings = getElementsByTagNames('h1', 'h2', 'h3');
    assert(buster.isElement(headings[0]));
    assert.equals(headings.length, 5);
    assert.tagName(headings[0], 'h1');
    assert.tagName(headings[4], 'h1');
  },
  "Make ToC item": function() {
    var heading = doc.createElement('h1');
    heading.id = 'foo';
    heading.textContent = 'Bar';
    var ToCItem = makeToCItem(heading);
    assert.tagName(ToCItem, 'li');
    assert.match(ToCItem.children[0], {
      tagName: 'a',
      textContent: 'Bar',
      href: '#foo',
      className: 'level1'
    });
  }});
