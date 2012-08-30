// StyleDocco documentation code/preview rendering and handling
// ===================================================================
// Takes the HTML code from preview textareas and renders iframes with
// the specified preview CSS and JavaScript applied.

(function() {

'use strict';

// Abort if rendering a preview page to avoid recursive iframe loading.
// This can happen in WebKit where we set the iframe src to `location.href`.
if (location.hash === '#__preview__' || location.protocol === 'data:') return;

var doc = document;
var win = window;
var el = styledocco.el;
var headEl = doc.head;
var bodyEl = doc.body;

// Filter based on regular expression
_.fns.filterRe = function(exp) {
  return this.filter(function(item) { return item.match(exp); });
};

// Parse `key=value; key=value` strings (for cookies).
var keyvalParse = function(str) {
  var obj = {};
  var pairs = str.split(';');
  for (var i = 0; pairs.length > i; i++) {
    var kvs = pairs[i].trim().split('=');
    obj[kvs[0]] = kvs[1];
  }
  return obj;
};

var removeClass = function(els, className) {
  return _(els).pluck('classList').invoke('remove', className);
};

var postMessage = function(target, msg) {
  target.contentDocument.defaultView.postMessage(msg, '*');
};

// Clone pseudo classes
// ====================
// Find the pseudo classes in a stylesheet object and return a string with
// the pseudo class selectors replaced with regular class selectors.
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


// Check if browser treats data uris as same origin.
var sameOriginDataUri = function(cb) {
  var iframeEl = el('iframe', { src: 'data:text/html,' });
  doc.body.appendChild(iframeEl);
  iframeEl.addEventListener('load', function() {
    var support = false;
    if (this.contentDocument) support = true;
    doc.body.removeChild(this);
    cb(null, support);
  });
};

// Create a preview iframe with a data uri src for supporting browsers,
// and fallback for others.
var createPreview = (function() {
  var dataUriSrc = 'data:text/html;charset=utf-8,' +
      encodeURIComponent('<!doctype html><html><head></head><body>');
  var fallbackSrc = location.href.split('#')[0] + '#__preview__';
  return function(id, dataUriSameOrigin) {
    var iframeEl = el('iframe', {
      scrolling: 'no',
      name: 'iframe' + id
    });
    iframeEl.src = dataUriSameOrigin ? dataUriSrc : fallbackSrc;
    return iframeEl;
  };
})();

var replaceDocumentContent = function(doc, content) {
  var el = styledocco.el.makeElFn(doc);
  doc.head.innerHTML = '';
  if (content.styles) {
    doc.head.appendChild(el('style', { text: content.styles }));
  }
  if (content.scripts) {
    doc.head.appendChild(el('script', { text: content.scripts }));
  }
  // Replace element to get rid of event listeners
  doc.body.parentNode.replaceChild(el('body', { html: content.html }), doc.body);
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

  return function(codeEl, support, iframeId) {
    var iframeEl = createPreview(iframeId, support.sameOriginDataUri);
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
      postMessage(this, 'getHeight');
    });
    var codeDidChange = function() {
      iframeEl.contentDocument.body.innerHTML = this.value;
      postMessage(this, 'getHeight');
    };
    codeEl.addEventListener('keypress', codeDidChange);
    codeEl.addEventListener('keyup', codeDidChange);
    codeEl.parentNode.insertBefore(previewEl, codeEl);
  };
})();


// Add an element with the same styles and content as the textarea to
// calculate the height of the textarea content.
var autoResizeTextArea = function(origEl) {
  var mirrorEl = el('div', { className: origEl.className });
  mirrorEl.style.position = 'absolute';
  mirrorEl.style.left = '-9999px';
  origEl.parentNode.appendChild(mirrorEl);
  var borderHeight = styledocco.getStyle(origEl, 'border-top') +
                     styledocco.getStyle(origEl, 'border-bottom');
  var maxHeight = styledocco.getStyle(origEl, 'max-height');
  var codeDidChange = function(ev) {
    mirrorEl.textContent = origEl.value + '\n';
    var height = mirrorEl.offsetHeight;
    origEl.style.height = (height - borderHeight) + 'px';
    origEl.style.overflowY = (maxHeight && height >= maxHeight) ? 'auto' : 'hidden';
  };
  origEl.addEventListener('keypress', codeDidChange);
  origEl.addEventListener('keyup', codeDidChange);
  codeDidChange(origEl);
  return mirrorEl;
};

// Add `className` to `el` and remove `className` from `el`'s siblings
var toggleSiblingClassNames = function(className, el) {
  _(el.parentNode.children).pluck('classList').invoke('remove', className);
  el.classList.add(className);
};
var activateElement = toggleSiblingClassNames.bind(undefined, 'is-active');

var resizeableButtons = function() {
  var settingsEl = bodyEl.getElementsByClassName('settings')[0];
  var resizeableEls = bodyEl.getElementsByClassName('resizeable');
  var resizeableElOffset = 30; // `.resizeable` padding
  var resizePreviews = function(width) {
    doc.cookie = 'preview-width=' + width;
    _(resizeableEls).forEach(function(el) {
      el.width = (width === 'auto' ? el.parentNode.offsetWidth : width) + 'px';
      // TODO: Add CSS transitions and update height after `transitionend` event
      postMessage(el.getElementsByTagName('iframe')[0], 'getHeight');
    });
  };

  // Resize previews to the cookie value.
  var previewWidth = keyvalParse(doc.cookie)['preview-width'];
  if (previewWidth) {
    resizePreviews(previewWidth);
    activateElement('button[data-width="' + previewWidth + '"]');
  }

  win.addEventListener('message', function (ev) {
    if (ev.data == null || !ev.source) return;
    var data = ev.data;
    var sourceFrameEl = doc.getElementsByName(ev.source.name)[0];
    // Set iframe height
    if (data.height != null && sourceFrameEl) {
      sourceFrameEl.parentNode.style.height = (data.height + resizeableElOffset) + 'px';
    }
  }, false);

  // Resizing buttons
  if (settingsEl && resizeableEls.length > 0) {
    settingsEl.hidden = false;
    settingsEl.addEventListener('click', function(event) {
      var tagName = event.target.tagName.toLowerCase();
      var btn;
      if (tagName === 'button') btn = event.target;
      else if (tagName === 'svg') btn = event.target.parentNode;
      else return;
      event.preventDefault();
      removeClass(settingsEl.getElementsByClassName('is-active'), 'is-active');
      btn.classList.add('is-active');
      var width = btn.dataset.width;
      resizePreviews(width);
    });
  }
};

// Expose testable functions
if (typeof test !== 'undefined') {
  test.activateElement = activateElement;
  test.autoResizeTextArea = autoResizeTextArea;
  test.clonePseudoClasses = clonePseudoClasses;
  test.createPreview = createPreview;
  test.sameOriginDataUri = sameOriginDataUri;
  test.replaceDocumentContent = replaceDocumentContent;
}


sameOriginDataUri(function(err, support) {
  // Loop through code textareas and render the code in iframes.
  _(bodyEl.getElementsByTagName('textarea')).forEach(function(codeEl, idx) {
    addIframe(codeEl, { sameOriginDataUri: support }, idx);
    resizeableButtons();
    autoResizeTextArea(codeEl);
  });
});

})();
