'use strict';

var doc = document;

buster.testCase("Code editing", {
  "Auto-resize textarea": function() {
    // Known to fail in Firefox, while the behavior seems to work as expected
    doc.head.innerHTML = '<style> * { margin:0; padding:0 }' +
      '.ta { border:5px solid; font: 10px/1 monospace; white-space: pre-wrap }';
    var orig = doc.createElement('textarea');
    orig.className = 'ta';
    orig.innerHTML = 'Lorem ipsum dolor sit amet';
    doc.body.appendChild(orig);
    var mirror = test.autoResizeTextArea(orig);
    assert.equals(mirror.offsetHeight, orig.offsetHeight);
  }
});
