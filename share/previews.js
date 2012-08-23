// StyleDocco JavaScript for preview iframes
// =========================================
(function () {

'use strict';

var styledocco = window.styledocco = window.styledocco || {};

// Helper functions
// ================
var mixin = function(obj, mix) {
  for (var key in mix) {
    if (mix.hasOwnProperty(key)) {
      Object.defineProperty(obj, key, Object.getOwnPropertyDescriptor(mix, key));
    }
  }
  return obj;
};
var understreck = {
  compact: function() {
    return understreck.filter.call(this, function(val) { return !!val; });
  },
  filter: function(fn) {
    return mixin(Array.prototype.filter.call(this, fn), understreck);
  },
  forEach: function() {
    return mixin(Array.prototype.forEach.call(this), understreck);
  },
  map: function(fn) {
    return mixin(Array.prototype.map.call(this, fn), understreck);
  },
  pluck: function(prop) {
    return understreck.map.call(this, function(item) { return item[prop]; } );
  }
};
var _ = function(obj) {
  return mixin(obj, understreck);
};


// Pseudo classes
// ==============
// Scans your stylesheet for pseudo classes and adds a class with the same name.
var processPseudoClasses = styledocco.processPseudoClasses = (function() {
  // Compile regular expression.
  var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
                  'enabled', 'disabled', 'checked' ];
  var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
  return function(styleSheets) {
    return _(styleSheets)
      .pluck('cssRules')
      .map(function(rule) {
        return _(rule)
          .pluck('cssText')
          .compact()
          // Keep only rules with pseudo classes.
          .filter(function(css) { return css.match(pseudoRe); })
          // Replace : with . and encoded :
          .map(function(css) { return css.replace(pseudoRe, ".\\3A $1"); })
          .join('');
      })
      .join('');
  };
})();

var styles = processPseudoClasses(document.styleSheets);
if (styles.length) {
  // Add a new style element with the processed pseudo class styles.
  var styleEl = document.createElement('style');
  styleEl.innerText = styles;
  var oldStyleEl = document.getElementsByTagName('style')[0];
  oldStyleEl.parentNode.insertBefore(styleEl, oldStyleEl);
}

// Resizing
// ========
// Get bottom-most point in document with an element.
// `offsetHeight`/`scrollHeight` will not work with absolute or fixed elements.
var getContentHeight = (function() {
  var bodyEl = document.getElementsByTagName('body')[0];
  var bodyStyle = window.getComputedStyle(bodyEl, null);
  return function() {
    if (bodyEl.childElementCount === 0) return bodyEl.offsetHeight;
    var els = bodyEl.getElementsByTagName('*');
    var elHeights = [];
    for (var i = 0, l = els.length; i < l; i++) {
      elHeights.push(els[i].offsetTop + els[i].offsetHeight +
        parseInt(window.getComputedStyle(els[i], null).getPropertyValue('margin-bottom')));
    }
    var height = Math.max.apply(Math, elHeights);
    height += parseInt(bodyStyle.getPropertyValue('padding-bottom'), 10);
    return Math.max(height, bodyEl.offsetHeight);
  };
})();

var callbacks = {
  getHeight: function() {
    window.parent.postMessage({ height: getContentHeight() }, '*');
  }
};
window.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

}());
