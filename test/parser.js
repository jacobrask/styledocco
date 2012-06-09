var async = require('async');
var fs = require('fs');
var path = require('path');
var parser = require('../lib/parser');

var cssDir = path.join(__dirname, '/fixtures/css/');

exports["Extract docs and code blocks"] = function(test) {
  fs.readdir(cssDir, function(err, files) {
    if (err != null) throw err;
    files = files.filter(function(filename) {
      return path.extname(file === '.css');
    });
    async.forEach(files, function(file, cb) {
      var baseFile = path.join(cssDir, path.basename(file, path.extname(file)));
      fs.readFile(baseFile + '.css', 'utf-8', function(err, css) {
        if (err != null) throw err;
        var extracted = parser(css);
        fs.readFile(baseFile + '.blocks.json', 'utf-8', function(err, json) {
          if (err != null) throw err;
          var saved = JSON.parse(json);
          test.deepEqual(extracted, saved, "Match failed for " + baseFile);
          cb();
        });
      });
    }, test.done);
  });
};
