// Scans your stylesheet for pseudo classes and adds a class with the same name.
// Thanks to Knyle Style Sheets for the idea.
// TODO: Add support for styles inside media queries.

(function() {

'use strict';

// Helper function needed to deal with array-like stylesheet objects.
var toArray = function(obj) { return Array.prototype.slice.call(obj); };

// Compile regular expression
var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
                'enabled', 'disabled', 'checked' ];
var pseudoRe = new RegExp(':((' + pseudos.join(')|(') + '))', 'gi');

// Only get inline style elements, and only the first one
var styleSheet = toArray(document.styleSheets)
  .filter(function(ss) {
    return ss.href == null
  })[0];
var processedStyles = toArray(styleSheet.cssRules)
  .filter(function(rule) {
    // Keep only rules with pseudo classes.
    return rule.selectorText && rule.selectorText.match(pseudoRe);
  })
  .map(function(rule) {
    // Replace : with . and encoded :
    return rule.cssText.replace(pseudoRe, '.\\3A $1');
  })
  .reduce(function(prev, cur) {
    return prev + cur;
  });

// Add the styles to the document
var styleEl = document.createElement('style');
styleEl.appendChild(document.createTextNode(processedStyles));
document.getElementsByTagName('head')[0].appendChild(styleEl);

})();
