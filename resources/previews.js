// StyleDocco JavaScript for preview iframes
// =========================================

(function () {

'use strict';

// Helper functions
// ================
var toArray = function(arr) { return Array.prototype.slice.call(arr); };
var add = function(a, b) { return a + b; };

// Get bottom-most point in document with an element.
// `offsetHeight`/`scrollHeight` will not work with absolute or fixed elements.
var getContentHeight = function() {
  var body = document.body;
  if (body.childElementCount === 0) return body.offsetHeight;
  var els = toArray(body.getElementsByTagName('*'));
  var elHeights = [];
  for (var i = 0, l = els.length; i < l; i++) {
    elHeights.push(els[i].offsetTop + els[i].offsetHeight);
  }
  var height = Math.max.apply(Math, elHeights);
  var padding = window.getComputedStyle(body, null)
    .getPropertyValue('padding-bottom');
  return height + parseInt(padding);
};

// Scans your stylesheet for pseudo classes and adds a class with the same name.
// Compile regular expression.
var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
                'enabled', 'disabled', 'checked' ];
var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
var processedPseudoClasses = toArray(document.styleSheets).filter(function(ss) {
  return !(ss.href != null);
}).map(function(ss) {
  return toArray(ss.cssRules).filter(function(rule) {
    // Keep only rules with pseudo classes.
    return rule.selectorText && rule.selectorText.match(pseudoRe);
  }).map(function(rule) {
    // Replace : with . and encoded :
    return rule.cssText.replace(pseudoRe, ".\\3A $1");
  }).reduce(add, '');
}).reduce(add, '');
if (processedPseudoClasses.length) {
  // Add a new style element with the processed pseudo class styles.
  var styleEl = document.createElement('style');
  styleEl.innerText = processedPseudoClasses;
  document.getElementsByTagName('head')[0].appendChild(styleEl);
}

var callbacks = {
  getHeight: function() {
    window.parent.postMessage({ height: getContentHeight() }, '*');
  }
};

window.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

}());
