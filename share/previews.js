// StyleDocco JavaScript for preview iframes
// =========================================
(function () {

'use strict';

var styledocco = window.styledocco = window.styledocco || {};

// Helper functions
// ================
var addFns = function(obj, mix) {
  for (var key in mix) {
    Object.defineProperty(obj, key, {
      configurable: true,
      writeable: true,
      value: mix[key]
    });
  }
  return obj;
};

var understreck = {
  filter: function(fn) {
    return addFns(Array.prototype.filter.call(this, fn), understreck);
  },
  forEach: function() {
    return addFns(Array.prototype.forEach.call(this), understreck);
  },
  map: function(fn) {
    return addFns(Array.prototype.map.call(this, fn), understreck);
  },
  // Remove falsy values
  compact: function() {
    return this.filter(function(val) { return !!val; });
  },
  // Filter based on regular expression
  filterRe: function(exp) {
    return this.filter(function(item) { return item.match(exp); });
  },
  // Invoke method
  invoke: function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.map(function(obj) { return obj[method].apply(obj, args); });
  },
  // Get object property
  pluck: function(prop) {
    return this.map(function(item) { return item[prop]; } );
  }
};

var _ = function(obj) {
  return addFns(obj, understreck);
};


// Clone pseudo classes
// ====================
// Scans your stylesheet for pseudo classes and adds a class with the same name.
var clonePseudoClasses = styledocco.clonePseudoClasses = (function() {
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
          .filterRe(pseudoRe) // Keep only rules with pseudo classes
          .invoke('replace', pseudoRe, ".\\3A $1") // Replace : with . and encoded :
          .join('');
      })
      .join('');
  };
})();

var styles = clonePseudoClasses(document.styleSheets);
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
var getContentHeight = styledocco.getContentHeight = function(doc) {
  var win = doc.defaultView;
  var bodyEl = doc.getElementsByTagName('body')[0];
  var bodyStyle = win.getComputedStyle(bodyEl, null);
  if (bodyEl.childElementCount === 0) return bodyEl.offsetHeight;
  var els = bodyEl.getElementsByTagName('*');
  var elHeights = [];
  for (var i = 0, l = els.length; i < l; i++) {
    elHeights.push(els[i].offsetTop + els[i].offsetHeight +
      parseInt(win.getComputedStyle(els[i], null).getPropertyValue('margin-bottom')));
  }
  var height = Math.max.apply(Math, elHeights);
  height += parseInt(bodyStyle.getPropertyValue('padding-bottom'), 10);
  return Math.max(height, bodyEl.offsetHeight);
};

var callbacks = {
  getHeight: function() {
    window.parent.postMessage({ height: getContentHeight(document) }, '*');
  }
};
window.addEventListener('message', function (ev) {
  if (ev.data == null) return;
  if (typeof ev.data === 'string') callbacks[ev.data]();
}, false);

}());
