// Scans your stylesheet for pseudo classes and adds a class with the same name.
// Thanks to Knyle Style Sheets for the idea.

(function() {

var pseudoRe = /(\:hover|\:focus|\:disabled|\:active|\:visited)/g;

var toArray = function(obj) {
  return Array.prototype.slice.call(obj);
};

// Only get inline style elements, and the first one.
var styleSheet = toArray(document.styleSheets)
  .filter(function(ss) {
    return ss.href == null
  })[0];

var processedStyles = toArray(styleSheet.cssRules)
  // Filter out rules with pseudo classes
  .filter(function(rule) {
    return pseudoRe.test(rule.selectorText);
  })
  .map(function(rule) {
    return rule.cssText.replace(pseudoRe, function(matched) {
      // Replace `:` with `.` + escaped colon.
      return matched.replace(':', '.\\3A ');
    })
  })
  .toString();

var styleEl = document.createElement('style');
styleEl.appendChild(document.createTextNode(processedStyles));
document.getElementsByTagName('head')[0].appendChild(styleEl);

})();
