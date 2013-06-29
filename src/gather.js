var fs = require('fs');
var async = require('async');
var findit = require('findit');
var jade = require('jade');
var path = require('path');

var helper = require('./helper');

// Find first file matching `re` in `dir`.
var findFile = function(dir, re, cb) {
  fs.stat(dir, function(err, stat) {
    var files = fs.readdir(dir, function(err, files) {
      files = files.sort().filter(function(file) { return file.match(re); });
      if (!files.length) cb(new Error('No file found.'));
      else cb(null, path.join(dir, files[0]));
    });
  });
};

var getFiles = function(inPath, cb) {
  fs.stat(inPath, function(err, stat) {
    if (err != null) return cb(err);
    if (stat.isFile()) {
      cb(null, [ inPath ]);
    } else {
      var finder = findit.find(inPath);
      var files = [];
      finder.on('file', function(file) { files.push(file); });
      finder.on('end', function() { cb(null, files); });
    }
  });
};

var resourcesDir = __dirname + '/../share/';

// TODO Write unit tests for these
module.exports = function(options) {
  return {
    template: function(cb) {
      fs.readFile(resourcesDir + 'docs.jade', 'utf8', function(err, contents) {
        if (err != null) return cb(err);
        cb(null, jade.compile(contents));
      });
    },
    docs: function(cb) {
      async.parallel({
        css: async.apply(fs.readFile, resourcesDir + 'docs.css', 'utf8'),
        js: function(cb) {
          async.parallel([
            async.apply(fs.readFile, resourcesDir + 'docs.ui.js', 'utf8'),
            async.apply(fs.readFile, resourcesDir + 'docs.previews.js', 'utf8')
          ], function(err, res) {
            if (err != null) return cb(err);
            cb(null, res.join(''));
          });
        }
      }, cb);
    },
    // Extra JavaScript and CSS files to include in previews.
    previews: function(cb) {
      fs.readFile(resourcesDir + 'previews.js', 'utf8', function(err, js) {
        if (err != null) return cb(err);
        var code = { js: js, css: '' };
        var files = options.include.filter(function(file) {
          return helper.inArray(['.css', '.js'], path.extname(file));
        });
        async.filter(files, path.exists, function(files) {
          async.reduce(files, code, function(tot, cur, cb) {
            fs.readFile(cur, 'utf8', function(err, contents) {
              if (err != null) return cb(err);
              tot[path.extname(cur).slice(1)] += contents;
              cb(null, tot);
            });
          }, cb);
        });
      });
    },
    // Find input files.
    files: function(cb) {
      async.reduce(options['in'], [], function(all, cur, cb) {
        getFiles(cur, function(err, files) {
          if (err != null) return cb(err);
          cb(null, all.concat(files));
        });
      }, function(err, files) {
        if (err != null) return cb(err);
        files = files.filter(function(file) {
          // No hidden files
          if (file.match(/(\/|^)\.[^\.\/]/)) return false;
          // Only supported file types
          if (!(path.extname(file) in helper.fileTypes)) return false;
          return true;
        }).sort();
        if (!files.length) cb(new Error(errorMessages.noFiles + ' in path "' + options['in'] + '"'));
        cb(null, files);
      });
    },
    // Look for a README file.
    readme: function(cb) {
      findFile(options.basePath, /^readme\.m(ark)?d(own)?/i, function(err, file) {
        if (file != null && err == null) return read(file);
        findFile(process.cwd(), /^readme\.m(ark)?d(own)?/i, function(err, file) {
          if (err != null) file = resourcesDir + 'README.md';
          read(file);
        });
      });
      var read = function(file) {
        fs.readFile(file, 'utf8', function(err, content) {
          if (err != null) cb(err);
          cb(null, content);
        });
      };
    }
  };
}

// vim: set sw=2 expandtab
