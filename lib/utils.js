(function() {
  var fs, path;

  fs = require('fs');

  path = require('path');

  exports.trimNewLines = function(str) {
    return str.replace(/^\n*/, '').replace(/\n*$/, '');
  };

  exports.makeDestination = function(file) {
    return path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.html');
  };

  exports.buildRootPath = function(str) {
    var depth, dots, root;
    depth = str.split('/').length > 1 ? str.split('/').length : str.split('\\').length;
    dots = (function() {
      var _results;
      _results = [];
      while (depth -= 1) {
        _results.push('..');
      }
      return _results;
    })();
    root = path.join.apply(path, dots);
    if (root.slice(-1) !== '/') root += '/';
    return root;
  };

  exports.findFile = function(dir, re) {
    var file, _ref;
    if (!fs.statSync(dir).isDirectory()) return null;
    file = (_ref = fs.readdirSync(dir).filter(function(file) {
      return file.match(re);
    })) != null ? _ref[0] : void 0;
    if (file != null) {
      return path.join(dir, file);
    } else {
      return null;
    }
  };

}).call(this);
