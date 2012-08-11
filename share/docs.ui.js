// StyleDocco documentation user interface elements
// ==================================================================
// Dropdown, search, display settings.

(function() {

'use strict';

/*global searchIndex:false, toc: false*/

// Helper functions. Using `Array.prototype` to make them work on NodeLists.
var inArray = function(arr, str) { return arr.indexOf(str) !== -1; };
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};
var filter = function(arr, it) { return Array.prototype.filter.call(arr, it); };
var flatten = function(arr) {
  arr = toArray(arr);
  return arr.reduce(function(tot, cur) {
    cur = toArray(cur);
    return tot.concat(isArray(cur) ? flatten(cur) : cur);
  }, []);
};
var forEach = function(arr, it) { return Array.prototype.forEach.call(arr, it); };
var toArray = function(obj) { return Array.prototype.slice.call(obj); };

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
  var btn = settingsEl.querySelector('button[data-width="' + previewWidth + '"]');
  if (btn) { btn.classList.add('is-active'); }
}
// Resizing buttons
if (settingsEl) {
  settingsEl.addEventListener('click', function(event) {
    var tagName = event.target.tagName.toLowerCase();
    if (tagName === 'button') var btn = event.target;
    else if (tagName === 'i') var btn = event.target.parentNode;
    else return;
    if (btn.tagName.toLowerCase() !== 'button') return;
    event.preventDefault();
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
    if (event.target.classList.contains('search')) return;
    searchList.classList.remove('is-active');
  });
  // Reset search box
  searchList.addEventListener('click', function(event) {
    searchEl.value = '';
  });

  var tocList = document.createElement('ul');
  tocList.className = 'nav-results toc-list';
  filter(bodyEl.getElementsByTagName('*'), function(el) {
    return inArray(['h1', 'h2', 'h3'], el.tagName.toLowerCase());
  }).map(function(h) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    var level = h.tagName.toLowerCase()[1];
    a.classList.add('level-' + level);
    el.appendChild(a);
    a.href = '#' + h.id;
    a.innerHTML = h.innerHTML;
    tocList.appendChild(el);
  });

  bodyEl.addEventListener('click', function(event) {
    var el = event.target;
    if (el.classList.contains('toc')) {
      event.preventDefault();
      tocList.classList.toggle('is-active');
    } else {
      tocList.classList.remove('is-active');
    }
  });

  navEl.appendChild(tocList);

})();

})();
