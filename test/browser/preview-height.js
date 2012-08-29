'use strict';

var getContentHeight = test.getContentHeight;

var doc = document;

buster.testCase("Get document height", {
  setUp: function() {
    if (!doc.styleSheets.length) {
      doc.head.appendChild(doc.createElement('style'));
    }
    this.styleSheet = doc.styleSheets[0];
    this.styleSheet.insertRule('* { margin: 0; padding: 0 }', 0);
    this.testEl = doc.createElement('div');
    this.testEl.id = 'content';
    doc.body.appendChild(this.testEl);
  },
  tearDown: function() {
    while (this.styleSheet.cssRules.length) this.styleSheet.deleteRule(0);
    doc.body.removeChild(this.testEl);
  },
  "position: static": function() {
    this.styleSheet.insertRule('#content { height: 200px }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "position: absolute": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: absolute }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "position: fixed": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: fixed }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "position: relative": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: relative }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "padding": function() {
    this.styleSheet.insertRule('#content { height: 160px; padding: 20px }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "margin": function() {
    this.styleSheet.insertRule('#content { height: 160px; margin: 20px 0 }', 1);
    assert.equals(getContentHeight(doc), 200);
  },
  "body-padding": function() {
    this.styleSheet.insertRule('body { padding: 20px }', 1);
    this.styleSheet.insertRule('#content { height: 160px }', 2);
    assert.equals(getContentHeight(doc), 200);
  }
});
