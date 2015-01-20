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

  (function() {
    var tocList = bodyEl.getElementsByClassName('bs-docs-sidenav')[0];
    if (!tocList) return;

    filter(bodyEl.getElementsByTagName('*'), function(el) {
      return inArray(['h1', 'h2', 'h3'], el.tagName.toLowerCase());
    }).map(function(h) {
      var el = document.createElement('li');
      var a = document.createElement('a');
      var lv = h.tagName.toLowerCase()[1];
      a.classList.add('lv' + lv);
      el.appendChild(a);
      a.href = '#' + h.id;
      a.innerHTML = h.innerHTML;
      tocList.appendChild(el);
    });

    tocList.removeChild(tocList.firstChild);

  })();

  (function() {
    var previewList = bodyEl.getElementsByClassName('preview-code');
    if (!previewList) return;

    forEach(previewList, function(el) {
      // el.firstChild.classList.add('highlight');
      el.classList.add('highlight');
    });

  })();

  (function() {
    var h1 = bodyEl.querySelectorAll('.bs-docs-section>h1');
    if (!h1) return;

    forEach(h1, function(el) {
      el.classList.add('page-header');
    });

  })();

})();
