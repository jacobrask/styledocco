// StyleDocco documentation code/preview rendering and handling
// ===================================================================
// Takes the HTML code from preview textareas and renders iframes with
// the specified preview CSS and JavaScript applied.

(function() {

'use strict';

// Abort if rendering a preview page (to avoid recursive iframe loading).
// This can happen in WebKit where we set the iframe src to `location.href`.
if (location.hash === '#__preview__' || location.protocol === 'data:') return;

// Helper functions. Using `Array.prototype` to make them work on NodeLists.
var forEach = function(arr, it) {
  return Array.prototype.forEach.call(arr, it);
};
var invoke = function(obj, fn) {
  var args = Array.prototype.slice.call(arguments, 2);
  return map(obj, function(value) {
    return (isFunction(fn) ? fn || value : value[fn]).apply(value, args);
  });
};
var isFunction = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Function]';
};
var map = function(arr, it) {
  return Array.prototype.map.call(arr, it);
};
var pluck = function(arr, prop) {
  return map(arr, function(item) { return item[prop]; } );
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
  return invoke(pluck(els, 'classList'), 'remove', className);
};

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
    resizeableButtons();
    autoResizeTextArea(codeEl);
  });
});

var addIframe = function(codeEl, support, iframeId) {
  var previewEl, resizeableEl, iframeEl;
  previewEl = document.createElement('div');
  previewEl.appendChild(resizeableEl = document.createElement('div'));
  previewEl.className = 'preview';
  resizeableEl.appendChild(iframeEl = document.createElement('iframe'));
  resizeableEl.className = 'resizeable';
  iframeEl.setAttribute('scrolling', 'no');
  iframeEl.name = 'iframe' + iframeId++;
  iframeEl.addEventListener('load', function() {
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
  iframeEl.setAttribute('src', iframeSrc);
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
var autoResizeTextArea = function(el) {
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

var resizeableButtons = function() {
  var settingsEl = bodyEl.getElementsByClassName('settings')[0];
  var resizeableEls = bodyEl.getElementsByClassName('resizeable');
  var resizeableElOffset = 30; // `.resizeable` padding
  var resizePreviews = function(width) {
    document.cookie = 'preview-width=' + width;
    forEach(resizeableEls, function(el) {
      if (width === 'auto') width = el.parentNode.offsetWidth;
      el.style.width = width + 'px';
      // TODO: Add CSS transitions and update height after `transitionend` event
      postMessage(el.getElementsByTagName('iframe')[0], 'getHeight');
    });
  };

  // Resize previews to the cookie value.
  var previewWidth = keyvalParse(document.cookie)['preview-width'];
  if (previewWidth) {
    resizePreviews(previewWidth);
    removeClass(settingsEl.getElementsByClassName('is-active'), 'is-active');
    var btn = settingsEl.querySelector('button[data-width="' + previewWidth + '"]');
    if (btn) { btn.classList.add('is-active'); }
  }

  window.addEventListener('message', function (ev) {
    if (ev.data == null || !ev.source) return;
    var data = ev.data;
    var sourceFrameEl = document.getElementsByName(ev.source.name)[0];
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

})();
