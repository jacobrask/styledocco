(function() {
  var fs, makeDestination, path;

  fs = require('fs');

  path = require('path');

  exports.trimNewLines = function(str) {
    return str.replace(/^\n*/, '').replace(/\n*$/, '');
  };

  exports.makeDestination = makeDestination = function(file) {
    return path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.html').replace(/[\\/]/g, '-');
  };

  exports.findFile = function(dir, re) {
    var file, _ref;
    if (!fs.statSync(dir).isDirectory()) return null;
    file = (_ref = fs.readdirSync(dir).sort().filter(function(file) {
      return file.match(re);
    })) != null ? _ref[0] : void 0;
    if (file == null) return null;
    return path.join(dir, file);
  };

  exports.makeMenu = function(files) {
    var file, key, link, menu, parts, _i, _len;
    menu = {};
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      link = {
        name: path.basename(file, path.extname(file)),
        href: 'html/' + makeDestination(file)
      };
      parts = file.split('/').splice(1);
      key = parts.length > 1 ? parts[0] : './';
      if (menu[key] != null) {
        menu[key].push(link);
      } else {
        menu[key] = [link];
      }
    }
    return menu;
  };

}).call(this);
