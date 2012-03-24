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
    var root;
    if (path.dirname(str) === '.') {
      root = path.dirname(str);
    } else {
      root = path.dirname(str).replace(/[^\/]+/g, '..');
    }
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
