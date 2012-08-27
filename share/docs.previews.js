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

// Check if browser treats data uris as same origin.
var sameOriginDataUri = function(doc, cb) {
  var iframeEl = el('iframe', { src: 'data:text/html,' });
  doc.body.appendChild(iframeEl);
  iframeEl.addEventListener('load', function() {
    var support = false;
    if (this.contentDocument) support = true;
    doc.body.removeChild(this);
    cb(null, support);
  });
};

// Get preview styles intended for preview iframes.
var styles = _(headEl.querySelectorAll('style[type="text/preview"]'))
  .pluck('innerHTML')
  .join('');
// Get preview scripts intended for preview iframes.
var scripts = _(headEl.querySelectorAll('script[type="text/preview"]'))
  .pluck('innerHTML')
  .join('');

sameOriginDataUri(doc, function(err, support) {
  // Loop through code textareas and render the code in iframes.
  _(bodyEl.getElementsByTagName('textarea')).forEach(function(codeEl, idx) {
    addIframe(codeEl, { sameOriginDataUri: support }, idx);
    resizeableButtons();
    autoResizeTextArea(codeEl);
  });
});

var addIframe = function(codeEl, support, iframeId) {
  var previewUrl = location.href.split('#')[0] + '#__preview__';
  var iframeEl;
  var previewEl = el('div.preview', [
    el('div.resizeable', [
      iframeEl = el('iframe', {
        scrolling: 'no',
        name: 'iframe' + iframeId
      })
    ])
  ]);
  iframeEl.addEventListener('load', function() {
    // Abort if we're loading a data uri in a browser without same origin data uri support.
    if (!support.sameOriginDataUri && this.src !== previewUrl) return;
    var doc = this.contentDocument;
    var el = styledocco.el.makeElFn(doc);
    if (!support.sameOriginDataUri) {
      // Replace iframe content with the preview code.
      doc.head.innerHTML = '';
      doc.body.parentNode.replaceChild(
        el('body', { html: codeEl.textContent }),
        doc.body);
    }
    // Add scripts and styles.
    doc.head.appendChild(el('style', { text: styles }));
    doc.head.appendChild(el('script', { text: scripts }));
    postMessage(this, 'getHeight');
  });
  var iframeSrc;
  if (!support.sameOriginDataUri) {
    iframeSrc = previewUrl;
  } else {
    iframeSrc = 'data:text/html;charset=utf-8,' +
      encodeURIComponent('<!doctype html><html><head></head></body>' +
        codeEl.textContent);
  }
  iframeEl.src = iframeSrc;
  var codeDidChange = function() {
    iframeEl.contentDocument.body.innerHTML = this.value;
    postMessage(iframeEl, 'getHeight');
  };
  codeEl.addEventListener('keypress', codeDidChange);
  codeEl.addEventListener('keyup', codeDidChange);
  codeEl.parentNode.insertBefore(previewEl, codeEl);
};

// Add an element with the same styles and content as the textarea to
// calculate the height of the textarea content.
var autoResizeTextArea = function(elem) {
  var mirrorEl = el('div.preview-code');
  mirrorEl.style.position = 'absolute';
  mirrorEl.style.left = '-9999px';
  bodyEl.appendChild(mirrorEl);
  var maxHeight = styledocco.getStyle('max-height');
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
  elem.addEventListener('keypress', codeDidChange);
  elem.addEventListener('keyup', codeDidChange);
  codeDidChange.call(elem);
};

var resizeableButtons = function() {
  var settingsEl = bodyEl.getElementsByClassName('settings')[0];
  var resizeableEls = bodyEl.getElementsByClassName('resizeable');
  var resizeableElOffset = 30; // `.resizeable` padding
  var resizePreviews = function(width) {
    doc.cookie = 'preview-width=' + width;
    _(resizeableEls).forEach(function(el) {
      if (width === 'auto') width = el.parentNode.offsetWidth;
      el.style.width = width + 'px';
      // TODO: Add CSS transitions and update height after `transitionend` event
      postMessage(el.getElementsByTagName('iframe')[0], 'getHeight');
    });
  };

  // Resize previews to the cookie value.
  var previewWidth = keyvalParse(doc.cookie)['preview-width'];
  if (previewWidth) {
    resizePreviews(previewWidth);
    removeClass(settingsEl.getElementsByClassName('is-active'), 'is-active');
    var btn = settingsEl.querySelector('button[data-width="' + previewWidth + '"]');
    if (btn) btn.classList.add('is-active');
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
  test.sameOriginDataUri = sameOriginDataUri;
}

})();
