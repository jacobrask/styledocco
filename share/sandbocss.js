// CSS sandboxer
// ===================================================================
// Takes strings of HTML and CSS and returns an iframe element.

(function() {

'use strict';

// Abort if rendering a sandboxed iframe, to avoid recursive iframe loading.
// This can happen in WebKit where we set the iframe src to `location.href`.
if (location.hash === '#__sandbocss__') return;

var doc = document;

// Check if browser treats data uris as same origin.
// WebKit will always throw an error for this check (even with try/catch),
// so we do it in a cacheable function to only get the error once.
//
// [Function] -> *async* -> [Boolean]
var sameOriginDataUri = (function() {
  var support, checking;
  return function(cb) {
    if (support != null) return setTimeout(cb, 10, support);
    // Already checking, please wait...
    if (checking) return setTimeout(sameOriginDataUri, 100, cb);
    checking = true;
    var iframeEl = doc.createElement('iframe');
    iframeEl.src = 'data:text/html,';
    doc.body.appendChild(iframeEl);
    iframeEl.addEventListener('load', function() {
      support = typeof this.contentDocument !== 'undefined';
      doc.body.removeChild(this);
      return cb(support);
    });
  };
})();


// Create an iframe with a data uri src for supporting browsers,
// and fallback for others.
//
// [Boolean] -> [HTMLIFrameElement]
var createLocalIFrame = (function() {
  var dataUriSrc = 'data:text/html;charset=utf-8,' +
      encodeURIComponent('<!doctype html><html><head></head><body>');
  var fallbackSrc = location.href.split('#')[0] + '#__sandbocss__';
  return function(dataUriSameOrigin) {
    var iframeEl = doc.createElement('iframe');
    iframeEl.src = dataUriSameOrigin ? dataUriSrc : fallbackSrc;
    return iframeEl;
  };
})();


// Replace an entire `documentElement` with a new one.
// Add supplied body content, scripts and styles.
//
// [HTMLDocument, Object] -> [HTMLDocument]
var replaceDocumentContent = function(doc, html, css) {
  var htmlEl, headEl, styleEl, bodyEl;
  // We want to replace the HTML element to avoid leaking any properties,
  // listeners, etc from iframes cloned from location.href.
  if (doc.defaultView.location.protocol !== 'data:') {
    htmlEl = doc.createElement('html');
    headEl = doc.createElement('head');
    bodyEl = doc.createElement('body');
    htmlEl.appendChild(headEl);
    htmlEl.appendChild(bodyEl);
    doc.replaceChild(htmlEl, doc.documentElement);
  } else {
    headEl = doc.head;
    bodyEl = doc.body;
  }
  headEl.appendChild(styleEl = doc.createElement('style'));
  styleEl.textContent = css || '';
  bodyEl.innerHTML = html || '';
};


// [Object, Function] -> *async* -> [HTMLIFrameElement]
var sandbocss = function(html, css, cb) {
  sameOriginDataUri(function(support) {
    var iframeEl = createLocalIFrame(support);
    iframeEl.addEventListener('load', function() {
      replaceDocumentContent(this.contentDocument, html, css);
    });
    cb(null, iframeEl);
  });
};

// Expose testable functions
sandbocss.createLocalIFrame = createLocalIFrame;
sandbocss.replaceDocumentContent = replaceDocumentContent;
sandbocss.sameOriginDataUri = sameOriginDataUri;

if (typeof module != 'undefined' && module.exports) {
  module.exports = sandbocss;
} else {
  window.sandbocss = sandbocss;
}

})();
