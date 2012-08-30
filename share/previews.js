// StyleDocco JavaScript for preview iframes
// =========================================
(function () {

'use strict';

var doc = document;
var win = window;
var el = styledocco.el;


// Get content height
// ==================
// Get the distance between element`s offsetParent and the bottom-most
// point of element. `offsetHeight` does not work with absolute or
// fixed positioned elements.
var getContentHeight = function(elem) {
  if (elem.childElementCount === 0) return elem.offsetHeight;
  var children = elem.getElementsByTagName('*');
  for (var i = 0, l = children.length, childHeights = [], child; i < l; i++) {
    child = children[i];
    childHeights.push(child.offsetTop + child.offsetHeight +
      styledocco.getStyle(child, 'margin-bottom')
    );
  }
  var extraHeight = styledocco.getStyle(elem, 'padding-bottom');
  var height = Math.max.apply(Math, childHeights) + extraHeight;
  return Math.max(height, elem.offsetHeight);
};

// Expose testable functions
if (typeof test !== 'undefined') {
  test.getContentHeight = getContentHeight;
}

var callbacks = {
  getHeight: function() {
    win.parent.postMessage({ height: getContentHeight(doc.body) }, '*');
  }
};
win.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

}());
