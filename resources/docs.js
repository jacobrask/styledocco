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

var body = document.getElementsByTagName('body')[0];

// Get example styles and scripts.
var styles = getExampleCode('style');
var scripts = getExampleCode('script');

// Loop through code examples and replace with iframes.
toArray(document.getElementsByClassName('example'))
  .forEach(function(exampleEl) {
    // Insert a new iframe with the current document as src, to be able to
    // interact with it even on localhost (in Chrome).
    var iframeWrapEl = document.createElement('div');
    iframeWrapEl.className = 'example';
    iframeWrapEl.style.display = 'none';
    var iframeEl = document.createElement('iframe');
    iframeEl.setAttribute('seamless', true);
    iframeWrapEl.appendChild(iframeEl);
    exampleEl.parentNode.insertBefore(iframeWrapEl, exampleEl);
    
    iframeEl.addEventListener('load', function(event) {
      // Use iframe's document object.
      var doc = this.contentDocument;
      
      // Replace iframe content with only the example HTML.
      doc.getElementsByTagName('body')[0].innerHTML = exampleEl.innerHTML;

      // Add example specific scripts and styles.
      var scriptEl = doc.createElement('script');
      scriptEl.innerHTML = scripts;
      var styleEl = doc.createElement('style');
      styleEl.innerHTML = styles;
      var headEl = doc.createElement('head');
      headEl.appendChild(styleEl);
      headEl.appendChild(scriptEl);
      var oldHeadEl = doc.getElementsByTagName('head')[0];
      oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);

      // Set the height of the iframe element to match the content.
      iframeWrapEl.style.display = 'block';
      this.style.height = doc.documentElement.offsetHeight + 'px';

      // Remove the old example element.
      exampleEl.parentNode.removeChild(exampleEl);
    });
    iframeEl.setAttribute('src', location.href);

    // Allow `resize` to shrink in WebKit by setting width/height to 0.
    iframeWrapEl.addEventListener('mousemove', function(event) {
      if (!this.wasResized) {
        if ((this.oldWidth || this.oldHeight) &&
            (this.oldWidth !== this.offsetWidth ||
             this.oldHeight !== this.offsetHeight)) {
          this.style.width = 0;
          this.style.height = 0;
          this.wasResized = true;
          this.oldWidth = null; this.oldHeight = null;
          iframeEl.style.height = '100%';
        }
        this.oldWidth = this.offsetWidth; 
        this.oldHeight = this.offsetHeight;
      }
    });
  });
}());
