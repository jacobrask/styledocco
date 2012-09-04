'use strict';

var doc = document;

var renderPreview = styledocco.renderPreview;
var clone = styledocco.renderPreview.clonePseudoClasses;

buster.testCase("Clone pseudo classes", {
  setUp: function() {
    if (!doc.styleSheets.length) {
      doc.head.appendChild(doc.createElement('style'));
    }
    this.styleSheet = doc.styleSheets[0];
  },
  tearDown: function() {
    while (this.styleSheet.cssRules.length) this.styleSheet.deleteRule(0);
  },
  "Regular": function() {
    this.styleSheet.insertRule('test1:hover { color: red; }', 0);
    assert.match(clone(doc.styleSheets), /test1\.\\3A\ hover {\s?color: red;? }/);
    this.styleSheet.insertRule('input[type=text]:disabled { color: red; }', 1);
    assert.match(
      clone(doc.styleSheets),
      /input\[type="?text"?\]\.\\3A\ disabled {\s?color: red;? }/
    );
  },
  "Media query": function() {
    this.styleSheet.insertRule("@media screen { test2:focus { color: blue; } }", 0);
    assert.match(
      clone(doc.styleSheets),
      /@media screen {\s*test2\.\\3A focus { color: blue;? }\s*}/);
  }
});

buster.testCase("Render preview iframe", {
  Create: function(done) {
    var mock = doc.createElement('textarea');
    mock.value = 'Foo';
    renderPreview(mock, function(err, iFrameEl) {
      assert.tagName(iFrameEl, 'iframe');
      doc.body.appendChild(iFrameEl);
      iFrameEl.addEventListener('load', function() {
        assert.equals(iFrameEl.contentDocument.body.innerHTML, 'Foo');
        done();
      });
    });
  },
  Update: function(done) {
    var mock = doc.createElement('textarea');
    mock.value = 'Foo';
    renderPreview(mock, function(err, iFrameEl) {
      doc.body.appendChild(iFrameEl);
      iFrameEl.addEventListener('load', function() {
        assert.equals(iFrameEl.contentDocument.body.innerHTML, 'Foo');
        mock.value = 'Bar';
        mock.dispatchEvent(new CustomEvent('input'));
        assert.equals(iFrameEl.contentDocument.body.innerHTML, 'Bar');
        done();
      });
    });
  }
});
