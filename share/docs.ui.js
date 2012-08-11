// StyleDocco documentation user interface elements
// ==================================================================
// Dropdown, search, display settings.

(function() {

'use strict';

/*global index:false*/

// Helper functions. Using `Array.prototype` to make them work on NodeLists.
var filter = function(arr, it) { return Array.prototype.filter.call(arr, it); };
var forEach = function(arr, it) { return Array.prototype.forEach.call(arr, it); };

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

var headEl = document.getElementsByTagName('head')[0];
var bodyEl = document.getElementsByTagName('body')[0];

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

var previewWidth = keyvalParse(document.cookie)['preview-width'];
if (previewWidth) {
  resizePreviews(previewWidth);
  forEach(settingsEl.getElementsByClassName('is-active'), function(el) {
    el.classList.remove('is-active');
  });
  settingsEl.querySelector('button[data-width="' + previewWidth + '"]')
    .classList.add('is-active');
}
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
  searchList.className = 'nav-results';
  forEach(searchIndex, function(item) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    el.appendChild(a);
    a.href = item.url;
    a.innerHTML = item.title;
    if (item.filename) {
      var filenameEl = document.createElement('span');
      filenameEl.innerHTML = item.filename;
      filenameEl.className = 'nav-results-filename';
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
    if (event.target.parentNode.className === 'nav') return;
    searchList.classList.remove('is-active');
  });
  // Reset search box
  searchList.addEventListener('click', function(event) {
    searchEl.value = '';
  });
})();

})();
