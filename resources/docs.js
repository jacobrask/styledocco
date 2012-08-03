// StyleDocco JavaScript for documentation
// =======================================

(function() {

'use strict';

// Helper functions
// ================
var toArray = function(arr) { return Array.prototype.slice.call(arr); };

var body = document.getElementsByTagName('body')[0];

// Iframe rendering and handling
// =============================
(function() {
  // Don't run this function if we're rendering a preview page.
  if (location.hash === '#__preview__' || location.protocol === 'data:') return;

  var resizeableElOffset = 30;

  window.addEventListener('message', function (ev) {
    if (ev.data == null || !ev.source) return;
    var data = ev.data;
    var sourceFrame = document.getElementsByName(ev.source.name)[0];
    if (data.height != null && sourceFrame) {
      sourceFrame.parentNode.style.height = (data.height + resizeableElOffset) + 'px';
    }
  }, false);


  var sumHtml = function(code, el) { return code + el.innerHTML; };
  // Get preview styles intended for preview iframes.
  var styles = toArray(document.querySelectorAll('style[type="text/preview"]'))
    .reduce(sumHtml, '');
  // Get preview scripts intended for preview iframes.
  var scripts = toArray(document.querySelectorAll('script[type="text/preview"]'))
    .reduce(sumHtml, '');

  // Detect support for accessing data uri iframe properties.
  // WebKit (and IE?) don't treat data uris as same origin [https://bugs.webkit.org/show_bug.cgi?id=17352].
  // This will always display an error in WebKit (even with try/catch).
  var iframeEl = document.createElement('iframe');
  iframeEl.src = 'data:text/html,';
  document.body.appendChild(iframeEl);
  iframeEl.addEventListener('load', function() {
    var support = {};
    if (this.contentDocument) support.dataIframes = true;
    else support.dataIframes = false;

    // Loop through code previews and replace with iframes.
    var previewUrl = location.href + '#__preview__';
    var previewEls = toArray(body.getElementsByClassName('preview'));
    previewEls.forEach(function(previewEl) {
      var iframeEl = document.createElement('iframe');
      iframeEl.setAttribute('scrolling', 'no');
      var resizeableEl = document.createElement('div');
      resizeableEl.className = 'resizeable';
      resizeableEl.appendChild(iframeEl);
      iframeEl.addEventListener('load', function(event) {
        var doc = this.contentDocument;
        var htmlEl = doc.documentElement;
        // Abort if we're loading a data uri in a browser without support.
        if (!support.dataIframes && this.src !== previewUrl) {
          return;
        } else if (this.src === previewUrl) {
          // Replace iframe content with the preview HTML.
          htmlEl = doc.createElement('html');
          var headEl = doc.createElement('head');
          var bodyEl = doc.createElement('body');
          bodyEl.innerHTML = this.code;
          htmlEl.appendChild(headEl);
          htmlEl.appendChild(bodyEl);
          doc.documentElement.parentNode.replaceChild(htmlEl, doc.documentElement);
        }
        // Add scripts and styles.
        var scriptEl, styleEl;
        var headEl = doc.createElement('head');
        headEl.appendChild(styleEl = doc.createElement('style'));
        headEl.appendChild(scriptEl = doc.createElement('script'));
        scriptEl.textContent = scripts;
        styleEl.textContent = styles;
        var oldHeadEl = doc.getElementsByTagName('head')[0];
        oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);
        previewEl.classList.add('has-loaded');

        // Set the height of the iframe element to match the content.
        resizeableEl.style.height = (getContentHeight(this) + 30) + 'px';
      });
      if (!support.dataIframes) {
        iframeEl.setAttribute('src', previewUrl);
        iframeEl.code = previewEl.innerHTML;
      } else {
        iframeEl.setAttribute('src', 'data:text/html;charset=utf-8,' +
          encodeURIComponent(previewEl.innerHTML));
      }
      previewEl.innerHTML = '';
      previewEl.appendChild(resizeableEl);
      resizeableEl.style.width = resizeableEl.offsetWidth + 'px';
    });
  });
  var resizePreviews = function(width) {
    var resizeable = toArray(body.getElementsByClassName('resizeable'));
    resizeable.forEach(function(el) {
      if (width === 'auto') width = el.parentNode.offsetWidth;
      el.style.width = width + 'px';
    });
    // $.cookie('preview-width', width);
  };

  // if ($.cookie('preview-width') != null) resizePreviews($.cookie('preview-width'));

  // Resizing buttons
  var settingsEl = body.getElementsByClassName('settings')[0];
  if (settingsEl) {
    settingsEl.addEventListener('click', function(event) {
      if (event.target.tagName.toLowerCase() !== 'button') return;
      event.preventDefault();
      var btn = event.target;
      var siblings = toArray(btn.parentNode.getElementsByTagName('button'));
      siblings.forEach(function(el) { el.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var width = btn.dataset.width;
      resizePreviews(width);
    });
  }
})();

// Dropdown menus
body.addEventListener('click', function(event) {
  var el = event.target;
  var dropdown = el.parentNode.getElementsByClassName('dropdown')[0];
  var activateDropdown = false;
  if (el.classList.contains('dropdown-toggle')) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!el.classList.contains('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  var toggles = toArray(body.getElementsByClassName('dropdown-toggle'));
  toggles.forEach(function(el) {
    el.classList.remove('is-active');
    dropdown.classList.remove('is-active');
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    (function() {
    el.classList.add('is-active');
    dropdown.classList.add('is-active');
    })();;
  }
});

})();
