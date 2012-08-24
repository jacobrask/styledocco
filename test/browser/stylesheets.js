var styleEl;
var clone = styledocco.clonePseudoClasses;

buster.testCase("Clone pseudo classes", {
  setUp: function() {
    document.getElementsByTagName('head')[0].appendChild(
      styleEl = document.createElement('style'));
  },
  "Regular": function() {
    styleEl.innerHTML = "test1:hover { color: red; }";
    assert.match(clone(
        document.styleSheets),
      /test1\.\\3A\ hover {\s?color: red;? }/);
    styleEl.innerHTML = "input[type=text]:disabled { color: red; }";
    assert.match(
      clone(document.styleSheets),
      /input\[type="?text"?\]\.\\3A\ disabled {\s?color: red;? }/);
  },
  "Media query": function() {
    styleEl.innerHTML = "@media screen { test2:focus { color: blue; } }";
    assert.match(
      clone(document.styleSheets),
      /@media screen {\s*test2\.\\3A focus { color: blue;? }\s*}/);
  }
});
