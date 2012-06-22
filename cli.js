'use strict';

var async = require('async');
var csso = require('csso');
var exec = require('child_process').exec;
var findit = require('findit');
var fs = require('fs');
var jade = require('jade');
var marked = require('marked');
var mkdirp = require('mkdirp');
var path = require('path');
var uglify = require('uglify-js');

var styledocco = require('./styledocco');

marked.setOptions({ sanitize: false, gfm: true });

// Get a filename without the extension
var baseFilename = function(str) {
  return path.basename(str, path.extname(str));
};

// Solve the relative path between two relative paths
var relative2 = function(from, to) {
  return path.relative(path.resolve(from), path.resolve(to));
};

// Build an HTML file name, named by it's path relative to basePath
var htmlFilename = function(file, basePath) {
  return path.join(
    path.dirname(relative2(basePath, file) || path.basename(basePath)),
    baseFilename(file) + '.html'
  ).replace(/[\\/]/g, '-');
};

// Find first file matching `re` in `dir`.
var findFile = function(dir, re) {
  if (!fs.statSync(dir).isDirectory()) return null;
  var files = fs.readdirSync(dir).sort().filter(function(file) {
    return file.match(re);
  });
  return files[0] != null ? path.join(dir, files[0]) : null;
};

// Return content of first existing file in argument list.
var readFirstFile = function() {
  var files = [].slice.call(arguments);
  for (var i = 0, len = files.length; i < len; i++) {
    if (path.existsSync(files[i])) {
      return fs.readFileSync(files[i], 'utf-8');
    }
  }
  return '';
};

// Make `link` objects for the menu.
var menuLinks = function(files, basePath) {
  return files.map(function(file) {
    var parts = file.split('/').splice(1);
    return {
      name: baseFilename(file),
      href: htmlFilename(file, basePath),
      directory: parts.length > 1 ? parts[0] : './'
    };
  })
  .reduce(function(links, link) {
    if (links[link.directory] != null) {
      links[link.directory].push(link);
    } else {
      links[link.directory] = [ link ];
    }
    return links;
  }, {});
};

var cli = function(options) {

  // Config
  var defaultResourceDir = path.resolve(__dirname, 'resources');

  // Filetypes and matching preprocessor binaries
  var fileTypes = {
    '.css': null,
    '.sass': 'sass',
    '.scss': 'scss',
    '.less': 'lessc',
    '.styl': 'stylus'
  };

  var log = options.verbose ? function(str) { console.log(str); }
                            : function() {};

  mkdirp(options.out);

  // Get custom or default template file
  var templateFile = readFirstFile(
    options.resources + '/docs.jade',
    defaultResourceDir + '/docs.jade'
  );
  // Compile the template
  var template = jade.compile(templateFile, {
    filename: templateFile
  });

  // Get custom or default CSS file
  var styledoccoCss = readFirstFile(
    options.resources + '/docs.css',
    defaultResourceDir + '/docs.css'
  );
  // Get custom include CSS
  styledoccoCss += readFirstFile(options.include);

  // Get custom or default JS file
  var js = readFirstFile(
    options.resources + '/docs.js',
    defaultResourceDir + '/docs.js'
  );

  // Render template
  var render = function(source, sections, css) {
    if (css == null) css = '';
    return template({
      title: baseFilename(source),
      sections: sections,
      project: { name: options.name, menu: menu },
      css: csso.justDoIt(styledoccoCss + css),
      js: uglify(js)
    });
  };

  // Find files
  var files = findit.sync(options.basePath)
    .filter(function(file) {
      // No hidden files
      if (file.match(/(\/|^)\.[^\.\/]/)) return false;
      // Only supported file types
      if (!(path.extname(file) in fileTypes)) return false;
      // Files only
      if (!fs.statSync(file).isFile()) return false;
      return true;
    }).sort();
  if (!files.length) return console.error('No files found');

  var preprocess = function(file, cb) {
    if (options.preprocessor || fileTypes[path.extname(file)]) {
      exec((options.preprocessor || fileTypes[path.extname(file)]) + ' ' + file, function(err, stdout, stderr) {
        // Fail gracefully on preprocessor errors
        if (err != null) console.error(err.message);
        if (stderr.length) console.error(stderr);
        cb(null, stdout || '');
      });
    } else {
      fs.readFile(file, 'utf8', cb);
    }
  };

  // Build menu
  var menu = menuLinks(files, options.basePath);

  // Run files through StyleDocco parser. Async needed due to preprocessing.
  async.map(files, function(file, cb) {
    var content = fs.readFileSync(file, 'utf-8');
    preprocess(file, function(err, css) {
      cb(null, {
        path: file,
        html: render(file, styledocco(content), css)
      });
    });
  }, function(err, htmlFiles) {
    // Look for a README file.
    var readmeFile = findFile(options.basePath, /^readme/i) ||
                     findFile(process.cwd(), /^readme/i) ||
                     findFile(options.resources, /^readme/i) ||
                     defaultResourceDir + '/README.md';
    var readme = fs.readFileSync(readmeFile, 'utf-8');

    // Add readme with "fake" index path
    htmlFiles.push({
      path: path.join(options.basePath, 'index'),
      html: render('', [ { docs: marked(readme), code: '' } ])
    });

    // Write files to the output dir.
    htmlFiles.map(function(file) {
      var dest = path.join(options.out, htmlFilename(file.path, options.basePath));
      return fs.writeFileSync(dest, file.html);
    });
  });
};

module.exports = cli;
module.exports.htmlFilename = htmlFilename;
module.exports.menuLinks = menuLinks;
