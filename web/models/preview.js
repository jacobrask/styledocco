'use strict';

var Backbone = require('backbone');
var Model = Backbone.Model;

var Preview = Model.extend({

  initialize: function() {


  },

  // Get the actual height of the iframe's content by getting the distance
  // between the element`s offsetParent and the bottom-most point of any child
  // elements. `offsetHeight` does not work with absolute or fixed positioned elements.
  getHeight: function () {
    var elem = this.iframe.contentDocument.body;
    if (elem.childElementCount === 0) return elem.offsetHeight;
    var win = elem.ownerDocument.defaultView;
    var children = elem.getElementsByTagName('*');
    for (var i = 0, l = children.length, childHeights = [], child; i < l; i++) {
      child = children[i];
      childHeights.push(child.offsetTop + child.offsetHeight +
        parseInt(win.getComputedStyle(child).getPropertyValue('margin-bottom'), 10)
      );
    }
    var extraHeight = parseInt(win.getComputedStyle(elem).getPropertyValue('padding-bottom'), 10);
    var height = Math.max.apply(Math, childHeights) + extraHeight;
    return Math.max(height, elem.offsetHeight);
  }

});

module.exports = Preview;
