// StyleDocco preview rendering
// ============================

(function () {

'use strict';

// Browserify
var _, domsugar, sandbocss;
if (typeof module == "object" && typeof require == "function") {
  _ = require('./iterhate');
  domsugar = require('./domsugar');
  sandbocss = require('./sandbocss');
} else {
  _ = window._;
  domsugar = window.domsugar;
  sandbocss = window.sandbocss;
}

var doc = document;
var el = domsugar(doc);


// Clone pseudo class selectors in a stylesheet with regular class selectors.
// For example, `a:hover` becomes `a.:hover`.
//
// [StyleSheetList] -> [String]
var clonePseudoClasses = (function() {
  // Compile regular expression.
  var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
    'enabled', 'disabled', 'checked' ];
  var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
  return function(styleSheets) {
    return _(styleSheets)
      .pluck('cssRules')
      .map(function(rule) {
        return _(rule)
          .pluck('cssText')
           // Keep only rules with pseudo classes
          .filter(function(item) { return item.match(pseudoRe); })
          // Replace : with . and encoded :
          .invoke('replace', pseudoRe, ".\\3A $1")
          .join('');
      })
      .join('');
  };
})();


// Create and insert an iframe
var renderPreview = (function() {
  // Get preview styles and scripts intended for preview iframes.
  var styles = _(doc.head.querySelectorAll('style[type="text/preview"]'))
    .pluck('innerHTML').join('');
  var scripts = _(doc.head.querySelectorAll('script[type="text/preview"]'))
    .pluck('innerHTML').join('');

  return function(codeEl, cb) {
    cb = cb || function() {};
    if (location.hash === '#__sandbocss__') {
      return cb(new Error('Attempting to render preview in sandboxed iframe'));
    }
    sandbocss(codeEl.value, styles, function(err, iFrameEl) {

      iFrameEl.scrolling = 'no';

      var previewEl = el('.preview', [ el('.resizeable', [ iFrameEl ]) ]);

      iFrameEl.addEventListener('load', function() {
        var doc = this.contentDocument;
        var el = domsugar(doc);
        // Add specified preview scripts.
        doc.head.appendChild(el('script', { text: scripts }));
        // Add a new style element with cloned pseudo classes.
        doc.head.insertBefore(
          el('style', { text: clonePseudoClasses(doc.styleSheets) }),
          doc.head.getElementsByTagName('style')[0]
        );
        cb(null, iFrameEl);
      });

      codeEl.addEventListener('edit', function() {
        iFrameEl.contentDocument.body.innerHTML = this.value;
      });

      codeEl.parentNode.insertBefore(previewEl, codeEl);
    });
  };
})();

renderPreview.clonePseudoClasses = clonePseudoClasses;

if (typeof module != 'undefined' && module.exports) {
  module.exports = renderPreview;
} else {
  window.styledocco = window.styledocco || {};
  window.styledocco.renderPreview = renderPreview;
}

}());
