'use strict';

var doc = document;
var el = window.domsugar(doc);

buster.testCase("DOM sugar", {
  Create: function() {
    assert(buster.isElement(el('p')));
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
    assert.match(el('span.bar#foo'), {
      id: 'foo',
      className: 'bar'
    });
  },
  properties: function() {
    assert.match(el('span', { text: 'Foo' }), { textContent: 'Foo' });
    assert.match(el('input', { disabled: true }), { disabled: true });
    assert.match(el('input', { disabled: 'Foo' }), { disabled: true });
    assert.match(el('input', { value: 'Foo' }), { value: 'Foo' });
    assert.equals(el('p', { garbage: 'Foo' }).getAttribute('garbage'), 'Foo');
  },
  modify: function() {
    var div = doc.createElement('div');
    assert.tagName(el(div), 'div');
    assert.className(el(div, { className: 'foo' }), 'foo');
    assert.equals(el(div, { id: 'foo' }).id, 'foo');
  },
  children: function() {
    assert.equals(el('p', [ el('blink'), el('blink') ]).childElementCount, 2);
    assert.match(el('p', [ 'foo', 'bar' ]), { textContent: 'foobar' });
  },
  escaping: function() {
    assert.match(el('span', { text: '<b>' }), { innerHTML: '&lt;b&gt;' });
    assert.match(el('span', [ '<b>' ]), { innerHTML: '&lt;b&gt;' });
    assert.match(el('span', { html: '<b>' }), { innerHTML: '<b>' });
  }

});
