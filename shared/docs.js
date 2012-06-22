(function () {

'use strict';

// Scans your stylesheet for pseudo classes and adds a class with the same name.
// Thanks to Knyle Style Sheets for the idea.
$.domReady(function() {
  addPseudoClasses();
});

var _ = require('underscore');

var add = function(a, b) { return a + b; };

var addPseudoClasses = function() {
  // Compile regular expression.
  var pseudos = ['link', 'visited', 'hover', 'active', 'focus', 'target', 'enabled', 'disabled', 'checked'];
  var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
  var processedPseudoClasses = _.toArray(document.styleSheets).filter(function(ss) {
    return !(ss.href != null);
  }).map(function(ss) {
    return _.toArray(ss.cssRules).filter(function(rule) {
      // Keep only rules with pseudo classes.
      return rule.selectorText && rule.selectorText.match(pseudoRe);
    }).map(function(rule) {
      // Replace : with . and encoded :
      return rule.cssText.replace(pseudoRe, ".\\3A $1");
    }).reduce(add);
  }).reduce(add, '');
  if (processedPseudoClasses.length) {
    // Add a new style element with the processed pseudo class styles.
    return $('head').append($('<style />').text(processedPseudoClasses));
  }
};

}());
