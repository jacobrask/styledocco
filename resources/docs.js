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

var body = document.getElementsByTagName('body')[0];

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
      var height = doc.documentElement.offsetHeight;
      height = height + parseInt(getStyle(this, 'border-top-width'))
                      + parseInt(getStyle(this, 'border-bottom-width'));
      this.style.height = height + 'px';
      this.style.display = 'block';

      exampleEl.parentNode.removeChild(exampleEl);
    });
    var backdropEl = document.createElement('div');
    backdropEl.className = 'backdrop';

    var buttonEl = document.createElement('button');
    buttonEl.className = 'btn zoom';
    buttonEl.innerHTML = 'zoom';
    buttonEl.addEventListener('click', function(event) {
      event.preventDefault();
      body.appendChild(backdropEl);
      body.classList.add('has-modal');
      iframeEl.classList.add('modal');
      iframeEl.style['top'] = Math.round(document.body.scrollTop + (window.innerHeight / 2)) + 'px';
      backdropEl.addEventListener('click', function() {
        body.removeChild(this);
        body.classList.remove('has-modal');
        iframeEl.classList.remove('modal');
      });
    });

    iframeEl.parentNode.insertBefore(buttonEl, iframeEl);
  });
}());
