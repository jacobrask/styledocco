// StyleDocco JavaScript for preview iframes
// =========================================
(function () {

'use strict';

var doc = document;
var win = window;
var el = styledocco.el;

// Filter based on regular expression
_.fns.filterRe = function(exp) {
  return this.filter(function(item) { return item.match(exp); });
};

// Clone pseudo classes
// ====================
// Scans your stylesheet for pseudo classes and adds a class with the same name.
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
          .filterRe(pseudoRe) // Keep only rules with pseudo classes
          .invoke('replace', pseudoRe, ".\\3A $1") // Replace : with . and encoded :
          .join('');
      })
      .join('');
  };
})();

var headEl = doc.head;
var bodyEl = doc.body;

// Add a new style element with the processed pseudo class styles.
var styles = clonePseudoClasses(doc.styleSheets);
if (styles.length) {
  headEl.insertBefore(
    el('style', { text: styles }),
    headEl.getElementsByTagName('style')[0]
  );
}


// Resizing
// ========
// Get bottom-most point in document with an element.
// `offsetHeight`/`scrollHeight` will not work with absolute or fixed elements.
var getContentHeight = (function() {
  var extraHeight = styledocco.getStyle(bodyEl, 'padding-bottom');
  return function() {
    if (bodyEl.childElementCount === 0) return bodyEl.offsetHeight;
    var els = bodyEl.getElementsByTagName('*');
    for (var i = 0, l = els.length, elHeights = [], elem; i < l; i++) {
      elem = els[i];
      elHeights.push(elem.offsetTop + elem.offsetHeight +
        styledocco.getStyle(elem, 'margin-bottom')
      );
    }
    var height = Math.max.apply(Math, elHeights) + extraHeight;
    return Math.max(height, bodyEl.offsetHeight);
  };
})();

var callbacks = {
  getHeight: function() {
    win.parent.postMessage({ height: getContentHeight() }, '*');
  }
};
win.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

// Expose testable functions
if (typeof test !== 'undefined') {
  test.clonePseudoClasses = clonePseudoClasses;
  test.getContentHeight = getContentHeight;
}

}());
