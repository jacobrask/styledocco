var doc = document;
var clone = styledocco.clonePseudoClasses;

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
