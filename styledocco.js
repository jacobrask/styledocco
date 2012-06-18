'use strict';

var io = require('./lib/io');
var parser = require('./lib/parser').parser;

var styledocco = function(cssPath, cb) {
  if (typeof cssPath !== 'string' || typeof cb !== 'function') {
    return cb(new TypeError());
  }
  io.readFile(cssPath, function(err, css) {
    if (err != null) cb(err);
    var parsed = parser(css);
    if (parsed == null) cb(new Error('Parser error'));
    cb(null, parsed);
  });
};

var sync = function(cssPath) {
  if (typeof cssPath !== 'string') return new TypeError();
  var css = io.readFileSync(cssPath);
  if (css == null) return new Error('Could not read' + cssPath);
  var parsed = parser(css);
  if (parsed == null) return new Error('Parser error');
  return parsed;
};

module.exports = styledocco;
module.exports.sync = sync;
module.exports.parser = parser;
