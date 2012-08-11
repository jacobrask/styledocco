// StyleDocco documentation code/preview rendering and handling
// ==================================================================
// Takes the HTML code from preview textareas and renders iframes with
// the specified preview CSS and JavaScript applied.

(function() {

'use strict';

// Abort if rendering a preview page (to avoid recursive iframe loading).
// This can happen in WebKit where we set the iframe src to `location.href`.
if (location.hash === '#__preview__' || location.protocol === 'data:') return;

// Helper functions. Using `Array.prototype` to make them work on NodeLists.
var forEach = function(arr, it) { return Array.prototype.forEach.call(arr, it); };
var map = function(arr, it) { return Array.prototype.map.call(arr, it); };
var pluck = function(arr, prop) { return map(arr, function(item) { return item[prop]; } ); };

var postMessage = function(target, msg) {
  target.contentDocument.defaultView.postMessage(msg, '*');
};

var headEl = document.getElementsByTagName('head')[0];
var bodyEl = document.getElementsByTagName('body')[0];

// Get preview styles intended for preview iframes.
var styles = pluck(
  headEl.querySelectorAll('style[type="text/preview"]'),
  'innerHTML').join('');
// Get preview scripts intended for preview iframes.
var scripts = pluck(
  headEl.querySelectorAll('script[type="text/preview"]'),
  'innerHTML').join('');

var previewUrl = location.href.split('#')[0] + '#__preview__';

// Check if browser treats data uris as same origin.
// This will always display an error in WebKit :-(
var iframeEl = document.createElement('iframe');
iframeEl.src = 'data:text/html,';
bodyEl.appendChild(iframeEl);
iframeEl.addEventListener('load', function() {
  var support = { sameOriginDataUri: false };
  if (this.contentDocument) support.sameOriginDataUri = true;
  this.parentNode.removeChild(this);
  // Loop through code textareas and render the code in iframes.
  forEach(bodyEl.getElementsByTagName('textarea'), function(codeEl, idx) {
    addIframe(codeEl, support, idx);
    autoResizeTextArea(codeEl);
  });
});

var addIframe = function(codeEl, support, iframeId) {
  var previewEl, resizeableEl, iframeEl;
  previewEl = document.createElement('div');
  previewEl.appendChild(resizeableEl = document.createElement('div'));
  resizeableEl.appendChild(iframeEl = document.createElement('iframe'));
  previewEl.className = 'preview';
  resizeableEl.className = 'resizeable';
  iframeEl.setAttribute('scrolling', 'no');
  iframeEl.name = 'iframe' + iframeId++;
  iframeEl.addEventListener('load', function(event) {
    var htmlEl, bodyEl, scriptEl, styleEl, headEl, oldHeadEl, doc;
    doc = this.contentDocument;
    // Abort if we're loading a data uri in a browser without same
    // origin data uri support.
    if (!support.sameOriginDataUri && this.src !== previewUrl) {
      return;
    // Otherwise replace iframe content with the preview code.
    } else if (this.src === previewUrl) {
      htmlEl = doc.createElement('html');
      htmlEl.appendChild(doc.createElement('head'));
      htmlEl.appendChild(bodyEl = doc.createElement('body'));
      bodyEl.innerHTML = codeEl.textContent;
      doc.replaceChild(htmlEl, doc.documentElement);
    }
    // Add scripts and styles.
    headEl = doc.createElement('head');
    headEl.appendChild(styleEl = doc.createElement('style'));
    headEl.appendChild(scriptEl = doc.createElement('script'));
    scriptEl.textContent = scripts;
    styleEl.textContent = styles;
    oldHeadEl = doc.getElementsByTagName('head')[0];
    oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);
    postMessage(iframeEl, 'getHeight');
  });
  if (!support.sameOriginDataUri) {
    var iframeSrc = previewUrl;
  } else {
    var iframeSrc = 'data:text/html;charset=utf-8,' + encodeURIComponent(
      '<!doctype html><html><head></head></body>' +
      codeEl.textContent);
  }
  iframeEl.setAttribute('src', iframeSrc);
  var codeDidChange = function() {
    iframeEl.contentDocument.body.innerHTML = this.value;
    postMessage(iframeEl, 'getHeight');
  };
  codeEl.addEventListener('keypress', codeDidChange);
  codeEl.addEventListener('keyup', codeDidChange);
  codeEl.parentNode.insertBefore(previewEl, codeEl);
};

var autoResizeTextArea = function(el) {
  // Add an element with the same styles and content as the textarea to
  // calculate the height of the textarea content.
  var mirrorEl = document.createElement('div');
  mirrorEl.className = 'preview-code';
  mirrorEl.style.position = 'absolute';
  mirrorEl.style.left = '-9999px';
  bodyEl.appendChild(mirrorEl);
  var maxHeight = parseInt(
    window.getComputedStyle(el).getPropertyValue('max-height'),
    10);
  var codeDidChange = function(ev) {
    mirrorEl.textContent = this.value + '\n';
    var height = mirrorEl.offsetHeight + 2; // Account for borders.
    if (height >= maxHeight) {
      this.style.overflow = 'auto';
    } else {
      this.style.overflow = 'hidden';
    }
    this.style.height = (mirrorEl.offsetHeight + 2) + 'px';
  };
  el.addEventListener('keypress', codeDidChange);
  el.addEventListener('keyup', codeDidChange);
  codeDidChange.call(el);
};

})();
