// vim: set shiftwidth=2 expandtab:
'use strict';

var spawn      = require('child_process').spawn
  , fs         = require('fs')
  , async      = require('async')
  , path       = require('path')

  , styledocco = require('./styledocco')
  , helper     = require('./helper')
  ;

var preprocess = function(file, pp, options, cb) {
  var stdout = '';
  // stdin would have been nice here, but not all preprocessors (less)
  // accepts that, so we need to read the file both here and for the parser.
  // Don't process SASS partials.
  if (file.match(/(^|\/)_.*\.s(c|a)ss$/) != null) {
    process.nextTick(function() { cb(null, ''); });
  } else if (pp != null) {
    pp += ' ' + file;
    pp = pp.split(' ');

    pp = spawn(pp.shift(), pp);

    pp.stderr.setEncoding('utf8');
    pp.stdout.setEncoding('utf8');

    pp.on('error', function(err) {
      if (err != null && options.verbose) console.error(err.message);
    });

    pp.on('close', function() {
      cb(null, stdout);
    });

    pp.stderr.on('data', function(data) {
      if (data.length && options.verbose) console.error(data);
    });

    pp.stdout.on('data', function(data) {
      stdout += data;
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
