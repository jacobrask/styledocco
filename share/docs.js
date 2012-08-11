// StyleDocco JavaScript for documentation
// =======================================
/*global index:false*/

(function() {

'use strict';

// Helper functions
// ================
// Using `Array.prototype` to make them work on Array-like objects.
var filter = function(arr, it) { return Array.prototype.filter.call(arr, it); };
var forEach = function(arr, it) { return Array.prototype.forEach.call(arr, it); };
var map = function(arr, it) { return Array.prototype.map.call(arr, it); };
var pluck = function(arr, prop) { return map(arr, function(item) { return item[prop]; } ); };

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
var postMessage = function(target, msg) {
  target.contentDocument.defaultView.postMessage(msg, '*');
};

var bodyEl = document.getElementsByTagName('body')[0];
var headEl = document.getElementsByTagName('head')[0];


// Iframe rendering and handling
// =============================
(function() {
  // Don't run this function if we're rendering a preview page.
  if (location.hash === '#__preview__' || location.protocol === 'data:') return;

  var settingsEl = bodyEl.getElementsByClassName('settings')[0];
  var resizeableElOffset = 30; // `.resizeable` padding
  var resizeableEls = bodyEl.getElementsByClassName('resizeable');
  var resizePreviews = function(width) {
    document.cookie = 'preview-width=' + width;
    forEach(resizeableEls, function(el) {
      if (width === 'auto') width = el.parentNode.offsetWidth;
      el.style.width = width + 'px';
      // TODO: Add CSS transitions and update height after `transitionend` event
      postMessage(el.getElementsByTagName('iframe')[0], 'getHeight');
    });
  };

  window.addEventListener('message', function (ev) {
    if (ev.data == null || !ev.source) return;
    var data = ev.data;
    var sourceFrameEl = document.getElementsByName(ev.source.name)[0];
    // Set iframe height
    if (data.height != null && sourceFrameEl) {
      sourceFrameEl.parentNode.style.height = (data.height + resizeableElOffset) + 'px';
    }
  }, false);

  // Get preview styles intended for preview iframes.
  var styles = pluck(headEl.querySelectorAll('style[type="text/preview"]'), 'innerHTML').join('');
  // Get preview scripts intended for preview iframes.
  var scripts = pluck(headEl.querySelectorAll('script[type="text/preview"]'), 'innerHTML').join('');

  // Check if browser treats data uris as same origin.
  // This will always display an error in WebKit.
  var iframeEl = document.createElement('iframe');
  iframeEl.src = 'data:text/html,';
  bodyEl.appendChild(iframeEl);
  iframeEl.addEventListener('load', function() {
    var support = {};
    if (this.contentDocument) support.dataIframes = true;
    else support.dataIframes = false;
    this.parentNode.removeChild(this);

    // Loop through code textareas and render the code in iframes.
    var previewUrl = location.href.split('#')[0] + '#__preview__';
    var iframeId = 0;
    forEach(bodyEl.getElementsByTagName('textarea'), function(codeEl) {
      var previewEl, resizeableEl, iframeEl;
      previewEl = document.createElement('div');
      previewEl.appendChild(resizeableEl = document.createElement('div'));
      resizeableEl.appendChild(iframeEl = document.createElement('iframe'));
      previewEl.className = 'preview';
      resizeableEl.className = 'resizeable';
      iframeEl.setAttribute('scrolling', 'no');
      iframeEl.name = 'iframe' + iframeId++;
      iframeEl.addEventListener('load', function(event) {
        var htmlEl, bodyEl, scriptEl, styleEl;
        var doc = this.contentDocument;
        // Abort if we're loading a data uri in a browser without support.
        if (!support.dataIframes && this.src !== previewUrl) {
          return;
        } else if (this.src === previewUrl) {
          // Replace iframe content with the preview HTML.
          htmlEl = doc.createElement('html');
          htmlEl.appendChild(doc.createElement('head'));
          htmlEl.appendChild(bodyEl = doc.createElement('body'));
          bodyEl.innerHTML = codeEl.textContent;
          doc.replaceChild(htmlEl, doc.documentElement);
        }
        var win = doc.defaultView;
        // Add scripts and styles.
        var headEl = doc.createElement('head');
        headEl.appendChild(styleEl = doc.createElement('style'));
        headEl.appendChild(scriptEl = doc.createElement('script'));
        scriptEl.textContent = scripts;
        styleEl.textContent = styles;
        var oldHeadEl = doc.getElementsByTagName('head')[0];
        oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);
        postMessage(iframeEl, 'getHeight');
      });
      var dataHtmlPrefix = 'data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><html><head></head></body>');
      if (!support.dataIframes) {
        iframeEl.setAttribute('src', previewUrl);
      } else {
        iframeEl.setAttribute('src', dataHtmlPrefix + encodeURIComponent(codeEl.textContent));
      }
      codeEl.parentNode.insertBefore(previewEl, codeEl);
      resizeableEl.style.width = resizeableEl.offsetWidth + 'px';

      var previewWidth = keyvalParse(document.cookie)['preview-width'];
      if (previewWidth) {
        resizePreviews(previewWidth);
        forEach(settingsEl.getElementsByClassName('is-active'), function(el) {
          el.classList.remove('is-active');
        });
        settingsEl.querySelector('button[data-width="' + previewWidth + '"]')
          .classList.add('is-active');
      }
      // An element with the same styles and content as the textarea to
      // calculate the height of the textarea content.
      var mirrorEl = document.createElement('div');
      mirrorEl.className = 'preview-code';
      mirrorEl.style.position = 'absolute';
      mirrorEl.style.left = '-99999px';
      bodyEl.appendChild(mirrorEl);
      // Auto update iframe when `textarea` changes and auto-resize textarea
      // to fit content.
      var maxHeight = parseInt(
        window.getComputedStyle(codeEl).getPropertyValue('max-height'),
        10);
      var codeDidChange = function() {
        iframeEl.contentDocument.body.innerHTML = codeEl.value;
        mirrorEl.textContent = codeEl.value + '\n';
        var height = mirrorEl.offsetHeight + 2;
        if (height >= maxHeight) {
          codeEl.style.overflow = 'auto';
        } else {
          codeEl.style.overflow = 'hidden';
        }
        codeEl.style.height = (mirrorEl.offsetHeight + 2) + 'px';
        postMessage(iframeEl, 'getHeight');
      };
      codeEl.addEventListener('keypress', codeDidChange);
      codeEl.addEventListener('keyup', codeDidChange);
      codeDidChange();
    });
  });

  // Resizing buttons
  if (settingsEl) {
    settingsEl.addEventListener('click', function(event) {
      if (event.target.tagName.toLowerCase() !== 'button') return;
      event.preventDefault();
      var btn = event.target;
      forEach(btn.parentNode.getElementsByClassName('is-active'), function(el) {
        el.classList.remove('is-active');
      });
      btn.classList.add('is-active');
      var width = btn.dataset.width;
      resizePreviews(width);
    });
  }
})();

// Dropdown menus
bodyEl.addEventListener('click', function(event) {
  var el = event.target;
  var activateDropdown = false;
  if (el.classList.contains('dropdown-toggle')) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!el.classList.contains('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  forEach(bodyEl.getElementsByClassName('dropdown-toggle'), function(el) {
    el.classList.remove('is-active');
    el.parentNode.getElementsByClassName('dropdown')[0].classList.remove('is-active');
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    el.classList.add('is-active');
    el.parentNode.getElementsByClassName('dropdown')[0].classList.add('is-active');
  }
});


(function() {
  var navEl = bodyEl.getElementsByClassName('nav')[0];
  if (!navEl) return;

  // Generate HTML elements for each ToC item
  var searchList = document.createElement('ul');
  searchList.className = 'search-results';
  forEach(searchIndex, function(item) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    el.appendChild(a);
    a.href = item.url;
    a.innerHTML = item.title;
    if (item.filename) {
      var filenameEl = document.createElement('span');
      filenameEl.innerHTML = item.filename;
      filenameEl.className = 'search-results-filename';
      a.appendChild(filenameEl);
    }
    el._title = item.title.toLowerCase();
    el.hidden = true;
    searchList.appendChild(el);
  });

  navEl.appendChild(searchList);

  var searchItems = searchList.children;

  var doSearch = function(ev) {
    // Hide all items
    forEach(searchItems, function(el) { el.hidden = true; });
    var val = this.value.toLowerCase();
    var filtered = [];
    if (val !== '') {
      filtered = filter(searchItems, function(el) {
        return (el._title.indexOf(val) !== -1);
      });
    }
    if (filtered.length > 0) {
      forEach(filtered, function(el) { el.hidden = false; });
      searchList.classList.add('is-active');
    } else {
      searchList.classList.remove('is-active');
    }
  };
  var searchEl = navEl.querySelector('input[type="search"]');
  searchEl.addEventListener('keyup', doSearch);
  searchEl.addEventListener('focus', doSearch);
  // Hide search results
  bodyEl.addEventListener('click', function(event) {
    if (event.target.parentNode.className === 'search') return;
    searchList.classList.remove('is-active');
  });
  // Reset search box
  searchList.addEventListener('click', function(event) {
    searchEl.value = '';
  });
})();

})();
