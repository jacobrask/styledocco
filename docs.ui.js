// StyleDocco documentation user interface elements
// ==================================================================
// Dropdowns and search.

(function() {

'use strict';
/*global searchIndex:false*/

// Helper functions. Using `Array.prototype` to make them work on NodeLists.
var inArray = function(arr, item) {
  return Array.prototype.indexOf.call(arr, item) !== -1;
};
var filter = function(arr, iterator) {
  return Array.prototype.filter.call(arr, iterator);
};
var forEach = function(arr, iterator) {
  return Array.prototype.forEach.call(arr, iterator);
};

var bodyEl = document.getElementsByTagName('body')[0];

// Dropdown menus.
bodyEl.addEventListener('click', function(event) {
  var el = event.target;
  if (el.tagName.toLowerCase() === 'svg') el = el.parentNode; // Button icons
  var activateDropdown = false;
  if (el.dataset.toggle != null) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!el.classList.contains('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  forEach(bodyEl.querySelectorAll('[data-toggle]'), function(el) {
    el.classList.remove('is-active');
    document.getElementById(el.dataset.toggle).hidden = true;
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    el.classList.add('is-active');
    document.getElementById(el.dataset.toggle).hidden = false;
  }
});

// Search and Table of Contents.
(function() {
  var navEl = bodyEl.getElementsByClassName('nav')[0];
  if (!navEl) return;

  // Generate HTML elements for each search item.
  var searchList = document.createElement('ul');
  searchList.className = 'nav-results';
  searchList.id = 'nav-search';
  searchList.hidden = true;
  forEach(searchIndex, function(item) {
    var el, linkEl, filenameEl;
    el = document.createElement('li');
    el._title = item.title.toLowerCase();
    el.hidden = true;
    el.appendChild(linkEl = document.createElement('a'));
    linkEl.href = item.url;
    linkEl.innerHTML = item.title;
    linkEl.appendChild(filenameEl = document.createElement('span'));
    filenameEl.innerHTML = item.filename;
    filenameEl.className = 'nav-results-filename';
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
      searchList.hidden = false;
    } else {
      searchList.hidden = true;
    }
  };
  var searchEl = navEl.querySelector('input[type="search"]');
  searchEl.addEventListener('keyup', doSearch);
  searchEl.addEventListener('focus', doSearch);
  // Hide search results
  bodyEl.addEventListener('click', function(event) {
    if (event.target.classList && event.target.classList.contains('search')) return;
    searchList.hidden = true;
  });
  // Reset search box
  searchList.addEventListener('click', function(event) {
    searchEl.value = '';
  });


  var tocList = document.createElement('ul');
  tocList.id = 'nav-toc';
  tocList.hidden = true;
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
  navEl.appendChild(tocList);

})();

})();
