// General purpose utitily functions
// =================================

var fs   = require('fs');
var path = require('path');

// Build an HTML file name, depending on the source path.
var makeDestination = exports.makeDestination = function(file, inPath) {
  var relPath = path.relative(
    path.resolve(inPath),
    path.resolve(file)
  ) || inPath;
  return path.join(
    path.dirname(relPath),
    path.basename(relPath, path.extname(relPath)) + '.html'
  ).replace(/[\\/]/g, '-');
};

// Find first file matching `re` in `dir`.
exports.findFile = function(dir, re) {
  if (!fs.statSync(dir).isDirectory()) {
    return null;
  }
  var files = fs.readdirSync(dir).sort().filter(function(file) {
    return file.match(re);
  });
  file = files[0];
  if (file == null) {
    return null;
  }
  return path.join(dir, file);
};

// Make `link` objects for the menu.
exports.makeMenu = function(files, inPath) {
  var file, key, link, parts;
  var menu = {};
  for (var i = 0, len = files.length; i < len; i++) {
    file = files[i];
    link = {
      name: path.basename(file, path.extname(file)),
      href: 'html/' + makeDestination(file, inPath)
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

// Get the path of a static resource
var getResourcePath = function(resourceDir, fileName) {
  if (path.existsSync(path.join(resourceDir, fileName))) {
    return path.join(resourceDir, fileName);
  } else {
    return path.resolve(__dirname, path.join('../resources', fileName));
  }
};
