// StyleDocco shared JavaScript
// ============================
(function () {

'use strict';

// If there is no local styledocco object, expose globally
window.styledocco = {};

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

var fns = {
  filter: function(fn) {
    return addFns(Array.prototype.filter.call(this, fn), fns);
  },
  forEach: function(fn) {
    Array.prototype.forEach.call(this, fn);
  },
  map: function(fn) {
    return addFns(Array.prototype.map.call(this, fn), fns);
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

styledocco._ = function(obj) {
  return addFns(obj, fns);
};

}());

