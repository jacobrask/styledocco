// StyleDocco documentation user interface elements
// ==================================================================
// Dropdowns and search.

(function() {

'use strict';
/*global searchIndex:false, styledocco:false*/

var doc = document;
var win = window;
var _ = styledocco._;
var el = styledocco.el;
var bodyEl = doc.body;

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
var toArray = function(obj) {
  return Array.prototype.slice.call(obj);
};
var getElementsByTagNames = function() {
  var tagNames = toArray(arguments);
  for (var i = 0, l = tagNames.length, els; i < l; i++) {
    els = els.concat(toArray(doc.getElementsByTagName(tagNames[i])));
  }
  return els;
};


// Dropdown menus.
bodyEl.addEventListener('click', function(event) {
  var activateDropdown = false;
  var elem = event.target;
  if (elem.tagName.toLowerCase() === 'svg') elem = elem.parentNode; // Button icons
  if (elem.dataset.toggle != null) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!elem.classList.contains('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  _(bodyEl.querySelectorAll('[data-toggle]')).forEach(function(elem) {
    elem.classList.remove('is-active');
    doc.getElementById(elem.dataset.toggle).hidden = true;
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    elem.classList.add('is-active');
    doc.getElementById(elem.dataset.toggle).hidden = false;
  }
});

// Search and Table of Contents.
(function() {
  var navEl = bodyEl.getElementsByClassName('nav')[0];
  if (!navEl) return;

  // Generate HTML elements for each search item.
  var searchList = el('ul#nav-search.nav-results', { hidden: true }, [
    searchIndex.map(function(item) {
      var elem = el('li', { hidden: true }, [
        el('a', {
          href: item.url,
          text: item.title
        }, [
          el('span.nav-results-filename', [ item.filename ])
        ])
      ]);
      elem._title = item.title.toLowerCase();
      return elem;
    })
  ]);
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

  // Build Table of Contents from page headings.
  /*
  navEl.appendChild(
    el('ul#nav-toc.nav-results.toc-list', { hidden: true }, [
      getElementsByTagNames('h1', 'h2', 'h3').map(function(h) {
        return el('li', [
          el('a', {
            href: '#' + h.id,
            text: h.textContent,
            className: 'level' + h.tagName.toLowerCase()[1]
          })
        ]);
      })
    ])
  );*/

})();

})();
