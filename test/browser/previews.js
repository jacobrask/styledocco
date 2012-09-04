'use strict';

var doc = document;

var renderPreview = styledocco.renderPreview;
var clone = styledocco.renderPreview.clonePseudoClasses;
var getContentHeight = styledocco.renderPreview.getContentHeight;

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

buster.testCase("Get element height", {
  setUp: function() {
    doc.head.innerHTML = '';
    doc.head.appendChild(doc.createElement('style'));
    this.styleSheet = doc.styleSheets[0];
    this.styleSheet.insertRule('* { margin: 0; padding: 0 }', 0);
    doc.body.innerHTML = '<div id="content"></div>';
  },
  tearDown: function() {
    doc.head.innerHTML = '';
    doc.body.innerHTML = '';
  },
  "position: static": function() {
    this.styleSheet.insertRule('#content { height: 200px }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "position: absolute": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: absolute }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "position: fixed": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: fixed }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "position: relative": function() {
    this.styleSheet.insertRule('#content { height: 200px; position: relative }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "padding": function() {
    this.styleSheet.insertRule('#content { height: 160px; padding: 20px }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "margin": function() {
    this.styleSheet.insertRule('#content { height: 160px; margin: 20px 0 }', 1);
    assert.equals(getContentHeight(doc.body), 200);
  },
  "body-padding": function() {
    this.styleSheet.insertRule('body { padding: 20px }', 1);
    this.styleSheet.insertRule('#content { height: 160px }', 2);
    assert.equals(getContentHeight(doc.body), 200);
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

buster.testCase("Update iframe height", {
  Create: function(done) {
    var mock = doc.createElement('textarea');
    renderPreview(mock, function(err, iFrameEl) {
      doc.body.appendChild(iFrameEl);
      iFrameEl.addEventListener('load', function() {
        var doc = this.contentDocument;
        doc.head.innerHTML = '<style>*{margin:0;padding:0}</style>';
        mock.dispatchEvent(new CustomEvent('input'));
        assert.equals(parseInt(iFrameEl.style.height, 10), 0);
        mock.value = '<p style="height:10px">';
        mock.dispatchEvent(new CustomEvent('input'));
        assert.equals(parseInt(iFrameEl.style.height, 10), 10);
        done();
      });
    });
  }
});
