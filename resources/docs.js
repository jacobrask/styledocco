(function () {

'use strict';

// Helper functions
// ----------------
var toArray = function(arr) { return Array.prototype.slice.call(arr); };

var getStyle = function(el, prop) {
  return window.getComputedStyle(el).getPropertyValue(prop);
};

// Get code intended for example iframes.
var getExampleCode = function(type) {
  return toArray(document.getElementsByTagName(type))
    .filter(function(el) {
      if (el.getAttribute('type') === 'text/example') return true;
      else return false;
    }).reduce(function(styles, el) { return styles += el.innerHTML; }, '');
};


// Main program
// ------------

// Get example styles and scripts.
var styles = getExampleCode('style');
var scripts = getExampleCode('script');

// Loop through code examples and replace with iframes.
toArray(document.getElementsByClassName('example'))
  .forEach(function(exampleEl) {
    // Insert a new iframe with the current document as src, to be able to
    // interact with it even on localhost.
    var iframeEl = document.createElement('iframe');
    iframeEl.setAttribute('src', location.href);
    iframeEl.setAttribute('seamless', true);
    iframeEl.setAttribute('class', 'example');
    exampleEl.parentNode.insertBefore(iframeEl, exampleEl);

    iframeEl.addEventListener('load', function(event) {
      var doc = this.contentDocument;
      var bodyEl    = doc.getElementsByTagName('body')[0];
      var oldHeadEl = doc.getElementsByTagName('head')[0];
      var headEl    = doc.createElement('head');
      var scriptEl  = doc.createElement('script');
      var styleEl   = doc.createElement('style');

      // Add example code, style and scripts to example iframe.
      bodyEl.innerHTML = exampleEl.innerHTML;
      scriptEl.innerHTML = scripts;
      styleEl.innerHTML = styles;
      headEl.appendChild(styleEl);
      headEl.appendChild(scriptEl);
      oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);

      // Set the height of the iframe element to match the content.
      var height = doc.documentElement.offsetHeight;
      height = height + parseInt(getStyle(this, 'border-top-width'))
                      + parseInt(getStyle(this, 'border-bottom-width'));
      this.style.height = height + 'px';
      this.style.display = 'block';

      exampleEl.parentNode.removeChild(exampleEl);
    });
  });


}());
