// vim: set shiftwidth=2 expandtab:
'use strict';

var exec       = require('child_process').exec
  , fs         = require('fs')
  , async      = require('async')
  , path       = require('path')

  , styledocco = require('./styledocco')
  , helper     = require('./helper')
  ;

var preprocess = function(file, pp, options, cb) {
  // stdin would have been nice here, but not all preprocessors (less)
  // accepts that, so we need to read the file both here and for the parser.
  // Don't process SASS partials.
  if (file.match(/(^|\/)_.*\.s(c|s)ss$/) != null) {
    process.nextTick(function() { cb(null, ''); });
  } else if (pp != null) {
    exec(pp + ' ' + file, function(err, stdout, stderr) {
      // log('styledocco: preprocessing ' + file + ' with ' + pp);
      // Fail gracefully on preprocessor errors
      if (err != null && options.verbose) console.error(err.message);
      if (stderr.length && options.verbose) console.error(stderr);
      cb(null, stdout || '');
    });
  } else {
    fs.readFile(file, 'utf8', cb);
  }
};

module.exports = function (options, file) {
  return {
    css: async.apply(preprocess
                   , file
                   , options.preprocessor || helper.fileTypes[path.extname(file)]
                   , options),
    docs: function(cb) {
      fs.readFile(file, 'utf8', function(err, code) {
        if (err != null) return cb(err);
        cb(null, styledocco(code));
      });
    }
  }
}
