// StyleDocco documentation main JavaScript
// ==================================================================

(function () {

'use strict';

// Abort if rendering a in a soon-to-be-sandboxed iframe.
if (location.hash === '#__sandbocss__') return;

var _ = require('./iterhate');
var domsugar = require('./domsugar');
var sandbocss = require('./sandbocss');

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
var addIFrame = (function() {
  // Get preview styles and scripts intended for preview iframes.
  var styles = _(doc.head.querySelectorAll('style[type="text/preview"]'))
    .pluck('innerHTML').join('');
  var scripts = _(doc.head.querySelectorAll('script[type="text/preview"]'))
    .pluck('innerHTML').join('');

  return function(codeEl, cb) {
    cb = cb || function() {};
    sandbocss(codeEl.textContent, styles, function(err, iFrameEl) {

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


_(doc.getElementsByClassName('preview-code')).forEach(function(codeEl) {

  addIFrame(codeEl);

  var editEvent = new CustomEvent('edit');
  var didChange = function() {
    if (this._oldValue !== this.value) this.dispatchEvent(editEvent);
    this._oldValue = this.value;
  };
  codeEl.addEventListener('change', didChange);
  codeEl.addEventListener('keypress', didChange);
  codeEl.addEventListener('keyup', didChange);

});

}());
