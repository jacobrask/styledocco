// Iterhate
// ===================================================================
// Simple iteration helpers for Node and the browser.

(function () {

'use strict';

var ArrayProto = Array.prototype, ObjectProto = Object.prototype;

var slice = ArrayProto.slice;
var isArray = Array.isArray;
var isCollection = function(obj) {
  return typeof obj === 'object' && obj.length !== 'undefined';
};
var isArrayLike = function(obj) {
  return !isArray(obj) && isCollection(obj);
};
var toArray = function(obj) {
  if (isArray(obj)) return obj;
  return slice.call(obj);
};

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
  filter: function() {
    return iterhate(ArrayProto.filter.apply(this, arguments));
  },
  map: function() {
    return iterhate(ArrayProto.map.apply(this, arguments));
  },
  reduce: function() {
    return iterhate(ArrayProto.reduce.apply(this, arguments));
  },
  reduceRight: function() {
    return iterhate(ArrayProto.reduceRight.apply(this, arguments));
  },
  // Remove falsy values
  compact: function() {
    return this.filter(function(val) { return !!val; });
  },
  // Allow concatenation of all kinds of collections
  concat: function() {
    return iterhate(ArrayProto.concat.apply(
      toArray(this),
      toArray(arguments).map(function(val) {
        if (isArrayLike(val)) return toArray(val);
        return val;
      })
    ));
  },
  // Flatten a nested collection
  flatten: function() {
    return this.reduce(function(memo, value) {
      if (isArray(value)) {
        return memo.concat(iterhate.fns.flatten.call(value));
      }
      memo[memo.length] = value;
      return memo;
    }, []);
  },
  // Check if value is present in collection
  include: function(val) {
    return this.indexOf(val) !== -1;
  },
  // Invoke method
  invoke: function(method) {
    var args = slice.call(arguments, 1);
    return this.map(function(obj) { return obj[method].apply(obj, args); });
  },
  // Get object property
  pluck: function(prop) {
    return this.map(function(item) { return item[prop]; } );
  }
};

// Methods to clone from Array.prototype
// Accessor methods
['join', 'slice', 'indexOf', 'lastIndexOf',
// Iteration methods which don't return a collection
'every', 'forEach', 'some'].forEach(function(method) {
  fns[method] = ArrayProto[method];
});

var iterhate = function(obj) {
  return addFns(obj, iterhate.fns);
};
iterhate.fns = fns;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = iterhate;
} else {
  window.iterhate = iterhate;
}

}());
