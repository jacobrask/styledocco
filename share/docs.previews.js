// StyleDocco preview rendering
// ===================================================================
// Takes the HTML code from preview textareas and renders iframes with
// the specified preview CSS and JavaScript applied.

(function() {

'use strict';

// Abort if rendering a preview page to avoid recursive iframe loading.
// This can happen in WebKit where we set the iframe src to `location.href`.
if (location.hash === '#__preview__' || location.protocol === 'data:') return;

var doc = document;
var el = styledocco.el;
var headEl = doc.head;
var bodyEl = doc.body;

var styledocco = window.styledocco || {};

styledocco.addPreviews = function(selector, cb) {
  var codeEls = bodyEl.querySelectorAll(selector);
  var done = codeEls.length;
  // Loop through code examples and render the code in iframes.
  _(codeEls).forEach(function(codeEl) {
    addIframe(codeEl);
    if (done--) cb();
  });
};

// Filter based on regular expression.
_.fns.filterRe = function(exp) {
  return this.filter(function(item) { return item.match(exp); });
};


// Clone pseudo classes
// ====================
// Clone pseudo class selectors in a stylesheet with regular class selectors.
// For example, `a:hover` becomes `a.:hover`.
//
// [StyleSheetList] -> [String]
var clonePseudoClasses = (function() {
  // Compile regular expression.
  var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
    'enabled', 'disabled', 'checked' ];
  var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
  return function(styleSheets) {
    return _(styleSheets)
      .pluck('cssRules')
      .map(function(rule) {
        return _(rule)
          .pluck('cssText')
          .filterRe(pseudoRe) // Keep only rules with pseudo classes
          .invoke('replace', pseudoRe, ".\\3A $1") // Replace : with . and encoded :
          .join('');
      })
      .join('');
  };
})();


// Detect same origin data uri support
// ===================================
// Check if browser treats data uris as same origin.
//
// [Function] -> *async* -> [Boolean]
var sameOriginDataUri = (function() {
  var support = null;
  return function(cb) {
    if (support !== null) return setTimeout(cb, 10, support);
    var iframeEl = el('iframe', { src: 'data:text/html,' });
    doc.body.appendChild(iframeEl);
    iframeEl.addEventListener('load', function() {
      support = typeof this.contentDocument !== 'undefined';
      doc.body.removeChild(this);
      return cb(support);
    });
  };
})();


// Create local iframe
// ===================
// Create an iframe with a data uri src for supporting browsers,
// and fallback for others.
//
// [Boolean] -> [HTMLIFrameElement]
var createLocalIframe = (function() {
  var dataUriSrc = 'data:text/html;charset=utf-8,' +
      encodeURIComponent('<!doctype html><html><head></head><body>');
  var fallbackSrc = location.href.split('#')[0] + '#__preview__';
  return function(dataUriSameOrigin) {
    var iframeEl = el('iframe', { scrolling: 'no' });
    iframeEl.src = dataUriSameOrigin ? dataUriSrc : fallbackSrc;
    return iframeEl;
  };
})();
var createPreview = function(cb) {
  return sameOriginDataUri(function(support) {
    cb(createLocalIframe(support));
  });
};


// Replace document content
// ========================
// Replace an entire `documentElement` with a new one.
// Add supplied body content, scripts and styles.
//
// [HTMLDocument, Object] -> [HTMLDocument]
var replaceDocumentContent = function(doc, content) {
  // We want to replace the HTML element to avoid leaking any properties,
  // listeners, etc. doc.write did unpredictable things.
  var el = styledocco.el.makeElFn(doc);
  var htmlEl = el('html');
  var headEl = el('head');
  htmlEl.appendChild(headEl);
  if (content.styles) {
    headEl.appendChild(el('style', { text: content.styles }));
  }
  if (content.scripts) {
    headEl.appendChild(el('script', { text: content.scripts }));
  }
  htmlEl.appendChild(el('body', { html: content.html }));
  doc.replaceChild(htmlEl, doc.documentElement);
};



var addIframe = (function() {
  // Get preview styles intended for preview iframes.
  var styles = _(headEl.querySelectorAll('style[type="text/preview"]'))
    .pluck('innerHTML')
    .join('');
  // Get preview scripts intended for preview iframes.
  var scripts = _(headEl.querySelectorAll('script[type="text/preview"]'))
    .pluck('innerHTML')
    .join('');

  return function(codeEl) {
    createPreview(function(iframeEl) {
      var previewEl = el('.preview', [ el('.resizeable', [ iframeEl ]) ]);
      iframeEl.addEventListener('load', function() {
        var doc = this.contentDocument;
        replaceDocumentContent(doc, {
          styles: styles, scripts: scripts, html: codeEl.textContent
        });
        // Add a new style element with the processed pseudo class styles.
        var processedStyles = clonePseudoClasses(doc.styleSheets);
        if (processedStyles.length) {
          doc.head.insertBefore(
            el('style', { text: processedStyles }),
            doc.head.getElementsByTagName('style')[0]
          );
        }
      });
      var codeDidChange = function() {
        var iframeBodyEl = iframeEl.contentDocument.body;
        iframeBodyEl.innerHTML = this.value;
      };
      codeEl.addEventListener('keypress', codeDidChange);
      codeEl.addEventListener('keyup', codeDidChange);
      codeEl.parentNode.insertBefore(previewEl, codeEl);
    };
  };
})();


// Expose testable functions
if (typeof test !== 'undefined') {
  test.clonePseudoClasses = clonePseudoClasses;
  test.createPreview = createPreview;
  test.sameOriginDataUri = sameOriginDataUri;
  test.replaceDocumentContent = replaceDocumentContent;
}

})();
