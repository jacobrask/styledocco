buster.testCase("Pseudo classes", {
  setUp: function() {
    var styleEl = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(styleEl);
  },
  "Regular": function() {
    document.getElementsByTagName('style')[0].innerHTML = "test1:hover { color: red; }";
    var processed = styledocco.processPseudoClasses(document.styleSheets);
    assert.match(processed, /test1\.\\3A\ hover {\s?color: red;? }/);
  },
  "Media query": function() {
    document.getElementsByTagName('style')[0].innerHTML = "@media screen { test2:focus { color: blue; } }";
    var processed = styledocco.processPseudoClasses(document.styleSheets);
    assert.match(processed, /@media screen {\s*test2\.\\3A focus { color: blue;? }\s*}/);
  }
});
