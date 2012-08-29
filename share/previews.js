// StyleDocco JavaScript for preview iframes
// =========================================
(function () {

'use strict';

var doc = document;
var win = window;
var el = styledocco.el;
var headEl = doc.head;
var bodyEl = doc.body;

// Filter based on regular expression
_.fns.filterRe = function(exp) {
  return this.filter(function(item) { return item.match(exp); });
};

// Clone pseudo classes
// ====================
// Find the pseudo classes in a stylesheet object and return a string with
// the pseudo class selectors replaced with regular class selectors.
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


// Get content height
// ==================
// Get the distance between element`s offsetParent and the bottom-most
// point of element. `offsetHeight` does not work with absolute or
// fixed positioned elements.
var getContentHeight = function(elem) {
  if (elem.childElementCount === 0) return elem.offsetHeight;
  var children = elem.getElementsByTagName('*');
  for (var i = 0, l = children.length, childHeights = [], child; i < l; i++) {
    child = children[i];
    childHeights.push(child.offsetTop + child.offsetHeight +
      styledocco.getStyle(child, 'margin-bottom')
    );
  }
  var extraHeight = styledocco.getStyle(elem, 'padding-bottom');
  var height = Math.max.apply(Math, childHeights) + extraHeight;
  return Math.max(height, elem.offsetHeight);
};

// Expose testable functions
if (typeof test !== 'undefined') {
  test.clonePseudoClasses = clonePseudoClasses;
  test.getContentHeight = getContentHeight;
}


// Add a new style element with the processed pseudo class styles.
var styles = clonePseudoClasses(doc.styleSheets);
if (styles.length) {
  headEl.insertBefore(
    el('style', { text: styles }),
    headEl.getElementsByTagName('style')[0]
  );
}

var callbacks = {
  getHeight: function() {
    win.parent.postMessage({ height: getContentHeight(bodyEl) }, '*');
  }
};
win.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

}());
