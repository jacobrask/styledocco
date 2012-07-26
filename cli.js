'use strict';

var async = require('async');
var cleancss = require('clean-css');
var exec = require('child_process').exec;
var findit = require('findit');
var fs = require('fs');
var jade = require('jade');
var marked = require('marked');
var mkdirp = require('mkdirp');
var path = require('path');
var uglifyjs = require('uglify-js');

var mincss = function(css) { return cleancss.process(css); };
var minjs = uglifyjs;

var styledocco = require('./styledocco');

marked.setOptions({ sanitize: false, gfm: true });

// Helper functions
var add = function(a, b) { return a + b; };
var readFileSync = function(file) { return fs.readFileSync(file, 'utf-8'); };

// Get a filename without the extension
var baseFilename = function(str) {
  return path.basename(str, path.extname(str));
};

// Build an HTML file name, named by it's path relative to basePath
var htmlFilename = function(file, basePath) {
  return path.join(
    path.dirname(path.relative(basePath, file) || path.basename(basePath)),
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
var readFirstFileSync = function() {
  var files = [].slice.call(arguments);
  for (var i = 0, len = files.length; i < len; i++) {
    if (path.existsSync(files[i])) {
      return readFileSync(files[i]);
    }
  }
  return '';
};

// Make `link` objects for the menu.
var menuLinks = function(files, basePath) {
  return files.map(function(file) {
    var parts = path.relative(basePath, file).split('/');
    parts.pop(); // Remove filename
    return {
      name: baseFilename(file),
      href: htmlFilename(file, basePath),
      directory: parts[parts.length-1] || './'
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

  // Compile custom or default template
  var template = jade.compile(
    readFirstFileSync(options.resources + '/docs.jade',
                      defaultResourceDir + '/docs.jade')
  );

  // Get custom or default JS and CSS files
  var staticFiles = {
    'jquery.min.js': readFileSync(defaultResourceDir + '/jquery.min.js'),
    'jquery.cookie.min.js': readFileSync(defaultResourceDir + '/jquery.cookie.min.js'),
    'docs.js': readFirstFileSync(options.resources + '/docs.js',
                                 defaultResourceDir + '/docs.js'),
    'docs.css': readFirstFileSync(options.resources + '/docs.css',
                                  defaultResourceDir + '/docs.css'),
    'previews.js': readFirstFileSync(options.resources + '/previews.js',
                                     defaultResourceDir + '/previews.js')
  };

  // Get optional extra CSS for previews
  var previewCSS = mincss(options.include
    .filter(function(file) { return path.extname(file) === '.css'; })
    .map(readFileSync)
    .reduce(add, '')
  );

  // Get optional extra JavaScript for previews
  var previewJS = minjs(options.include
    .filter(function(file) { return path.extname(file) === '.js'; })
    .map(readFileSync)
    .reduce(add, '')
  );


  // Render template
  var render = function(source, sections, css) {
    if (css == null) css = '';
    return template({
      title: baseFilename(source),
      sections: sections,
      project: { name: options.name, menu: menu },
      previewCSS: mincss(css) + previewCSS,
      previewJS: previewJS
    });
  };

  // Find files
  var files = options['in'].reduce(function(files, file) {
      if (fs.statSync(file).isDirectory()) {
        files = files.concat(findit.sync(file));
      } else {
        files.push(file);
      }
      return files;
    }, [])
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
    var pp = options.preprocessor || fileTypes[path.extname(file)];
    if (pp != null) {
      exec(pp + ' ' + file, function(err, stdout, stderr) {
        log('styledocco: preprocessing ' + file + ' with ' + pp);
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

  // Run files through preprocessor and StyleDocco parser.
  async.mapSeries(files, function(file, cb) {
    preprocess(file, function(err, css) {
      cb(null, {
        path: file,
        css: css
      });
    });
  }, function(err, htmlFiles) {

    var css = htmlFiles.reduce(function(css, file) {
      return css + file.css;
    }, '');

    htmlFiles = htmlFiles.map(function(file) {
      return {
        path: file.path,
        html: render(file.path, styledocco(readFileSync(file.path)), css)
      };
    });

    // Look for a README file.
    var readmeFile = findFile(options.basePath, /^readme/i) ||
                     findFile(process.cwd(), /^readme/i) ||
                     findFile(options.resources, /^readme/i) ||
                     defaultResourceDir + '/README.md';
    // Add readme with "fake" index path
    htmlFiles.push({
      path: path.join(options.basePath, 'index'),
      html: render('', styledocco.makeSections([ { docs: readFileSync(readmeFile), code: '' } ]), css)
    });

    // Write files to the output dir.
    htmlFiles.forEach(function(file) {
      var dest = path.join(options.out, htmlFilename(file.path, options.basePath));
      log('styledocco: writing ' + file.path + ' -> ' + dest);
      fs.writeFileSync(dest, file.html);
    });

    // Write static resources to the output dir
    Object.keys(staticFiles).forEach(function(file) {
      var dest = path.join(options.out, file);
      log('styledocco: writing ' + file + ' -> ' + dest);
      fs.writeFileSync(dest, staticFiles[file]);
    });
  });
};

module.exports = cli;
module.exports.htmlFilename = htmlFilename;
module.exports.menuLinks = menuLinks;
