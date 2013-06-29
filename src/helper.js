'use strict';

var util = require('util');
var cleancss = require('clean-css');

var isType = function(o, type) {
  return Object.prototype.toString.call(o) === '[object ' + type + ']';
}

var flatten = function(arr) {
  return arr.reduce(function(tot, cur) {
    return tot.concat(util.isArray(cur) ? flatten(cur) : cur);
  }, []);
};

module.exports = {
  mincss: function(css) { return cleancss.process(css); },
  minjs: require('uglify-js'),
  pluck: function(arr, prop) {
    return arr.map(function(item) { return item[prop]; });
  },
  flatten: flatten,
  inArray: function(arr, str) { return arr.indexOf(str) !== -1; },
  isString: function(obj) { return isType(obj, 'String'); },

  urlsRelative: function(css, path) {
    if (module.exports.isString(css) && module.exports.isString(path)) {
      path = path.indexOf('/', path.length -1) > -1? path : path + '/';
      var regex = /(url\(["']?)([^/'"][\w/.]*)/gm;
      return css.replace(regex, "$1" + path + "$2");
    } else {
      throw new Error('1st and 2nd args must be strings.');
    }
  },

  // Filetypes and matching preprocessor binaries.
  fileTypes: {
    '.css': null,
    '.sass': 'sass',
    '.scss': 'scss',
    '.less': 'lessc',
    '.styl': 'stylus'
  }
}

// vim: set sw=2 expandtab
