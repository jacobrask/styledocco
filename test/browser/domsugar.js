'use strict';

var doc = document;
var el = window.domsugar(doc);

buster.testCase("DOM sugar", {
  Create: function() {
    assert.tagName(el('p'), 'p');
    assert.tagName(el(), 'div');
  },
  className: function() {
    assert.className(el('.foo'), 'foo');
    assert.className(el(null, { className: 'foo' }), 'foo');
  },
  id: function() { 
    assert.equals(el('#foo').id, 'foo');
    assert.equals(el('p', { id: 'foo' }).id, 'foo');
  },
  modify: function() {
    var div = doc.createElement('div');
    assert.tagName(el(div), 'div');
    assert.className(el(div, { className: 'foo' }), 'foo');
    assert.equals(el(div, { id: 'foo' }).id, 'foo');
  }
});
