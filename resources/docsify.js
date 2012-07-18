(function () {

'use strict';

var $ = require('jquery-browserify');

// Don't run this script if we're rendering an preview page.
if (location.href === '#preview') return;

var toArray = function(arr) { return Array.prototype.slice.call(arr); };

var getStyle = function(el, prop) {
  return window.getComputedStyle(el).getPropertyValue(prop);
};

// Get code intended for preview iframes.
var getPreviewCode = function(type) {
  return toArray(document.getElementsByTagName(type))
    .filter(function(el) {
      if (el.getAttribute('type') === 'text/preview') return true;
      else return false;
    }).reduce(function(styles, el) { return styles += el.innerHTML; }, '');
};

// Get preview styles and scripts.
var styles = getPreviewCode('style');

var body = document.getElementsByTagName('body')[0];
var previews = toArray(body.getElementsByClassName('preview'));

// Loop through code previews and replace with iframes.
previews.forEach(
  function(oldPreviewEl) {
    // Insert a new iframe with the current document as src.
    // In Chrome this will count as same-origin, in other browsers it will
    // not load if it's on file systems, but still be script-modifiable.
    var iframeEl = document.createElement('iframe');
    iframeEl.setAttribute('seamless', 'seamless');
    iframeEl.code = oldPreviewEl.innerHTML;
    // Iframes cannot be resized with CSS, we need a wrapper element.
    var previewEl = document.createElement('div');
    previewEl.className = 'preview loading';
    var resizeEl = document.createElement('div');
    resizeEl.className = 'resize';
    resizeEl.appendChild(iframeEl);
    previewEl.appendChild(resizeEl);
    oldPreviewEl.parentNode.replaceChild(previewEl, oldPreviewEl);

    iframeEl.addEventListener('load', function(event) {
      // Use iframe's document object.
      var doc = this.contentDocument;
      var oldHeadEl = doc.getElementsByTagName('head')[0];
 
      // Replace iframe content with the preview HTML.
      doc.getElementsByTagName('body')[0].innerHTML = this.code;

      // Add preview specific scripts and styles.
      var scriptEl = doc.createElement('script');
      scriptEl.setAttribute('src', 'previews.js');
      var styleEl = doc.createElement('style');
      styleEl.innerHTML = styles;
      var headEl = doc.createElement('head');
      headEl.appendChild(styleEl);
      headEl.appendChild(scriptEl);
      var oldHeadEl = doc.getElementsByTagName('head')[0];
      oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);

      // Set the height of the iframe element to match the content.
      previewEl.classList.remove('loading');
      this.style.height = doc.documentElement.offsetHeight + 'px';
    });
    iframeEl.setAttribute('src', location.href + '#preview');
  });

body.addEventListener('mousemove',
  function(event) {
    var el = event.target;

    // Allow `resize` to shrink in WebKit by setting width/height to 0.
    if (!el.classList.contains('resize')) return;
    if (!el.wasResized) {
      if ((el.oldWidth || el.oldHeight) &&
          (el.oldWidth !== el.offsetWidth ||
           el.oldHeight !== el.offsetHeight)) {
        el.style.width = 0;
        el.style.height = 0;
        el.wasResized = true;
        el.oldWidth = null; el.oldHeight = null;
        el.getElementsByTagName('iframe')[0].style.height = '100%';
      }
      el.oldWidth = el.offsetWidth; 
      el.oldHeight = el.offsetHeight;
    }
  }
);

body.addEventListener('click',
  function(event) {
    var el = event.target;
    // Dropdown menu. Fairly ugly implementation with `nextElementSibling`,
    // works for now.
    var activateDropdown = false;
    if (el.classList.contains('dropdown-toggle')) {
      event.preventDefault();
      if (!el.classList.contains('is-active')) activateDropdown = true;
    }
    toArray(body.getElementsByClassName('dropdown-toggle')).forEach(function(el) {
      el.classList.remove('is-active');
      el.nextElementSibling.classList.remove('is-active');
    });
    if (activateDropdown) {
      event.preventDefault();
      el.classList.add('is-active');
      el.nextElementSibling.classList.add('is-active');
    }
  }
);
}());
