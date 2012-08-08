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
var util = require('util');

var styledocco = require('./styledocco');

var version = require('./package').version;

marked.setOptions({ sanitize: false, gfm: true });

// Helper functions
var mincss = function(css) { return cleancss.process(css); };
var minjs = uglifyjs;
var add = function(a, b) { return a + b; };
var pluck = function(arr, prop) {
  return arr.map(function(item) { return item[prop]; });
};
var flatten = function(arr) {
  return arr.reduce(function(tot, cur) {
    return tot.concat(isArray(cur) ? flatten(cur) : cur);
  }, []);
};
var inArray = function(arr, str) { return arr.indexOf(str) !== -1; };
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

// Get a filename without the extension
var baseFilename = function(str) { return path.basename(str, path.extname(str)); };

// Build an HTML file name, named by it's path relative to basePath
var htmlFilename = function(file, basePath) {
  return path.join(
    path.dirname(path.relative(basePath, file) || path.basename(basePath)),
    baseFilename(file) + '.html'
  ).replace(/[\\/]/g, '-');
};

// Find first file matching `re` in `dir`.
var findFile = function(dir, re, cb) {
  fs.stat(dir, function(err, stat) {
    var files = fs.readdir(dir, function(err, files) {
      files = files.sort().filter(function(file) { return file.match(re); });
      if (files.length) cb(null, path.join(dir, files[0]));
      else cb(new Error('No file found.'));
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

var preprocess = function(file, pp, cb) {
  // stdin would have been nice here, but not all preprocessors (less)
  // accepts that, so we need to read the file both here and for the parser.
  if (pp != null) {
    exec(pp + ' ' + file, function(err, stdout, stderr) {
      // log('styledocco: preprocessing ' + file + ' with ' + pp);
      // Fail gracefully on preprocessor errors
      if (err != null) console.error(err.message);
      if (stderr.length) console.error(stderr);
      cb(null, stdout || '');
    });
  } else {
    fs.readFile(file, 'utf8', cb);
  }
};


var cli = function(options) {

  var resourcesDir = __dirname + '/share/';

  // Filetypes and matching preprocessor binaries.
  var fileTypes = {
    '.css': null,
    '.sass': 'sass',
    '.scss': 'scss',
    '.less': 'lessc',
    '.styl': 'stylus'
  };

  var log = options.verbose ? function(str) { console.log(str); }
                            : function() {};

  var SDError = function(msg, err) {
    this.message = msg + '\n' + err.message + '\n' +
      'StyleDocco v' + version +
      ' running on Node ' + process.version + ' ' + process.platform;
    if (options.verbose) {
      this.message += '\nOptions: ' + JSON.stringify(options);
    }
  };
  util.inherits(SDError, Error);

  mkdirp(options.out);

  // Fetch all static resources.
  async.parallel({
    template: function(cb) {
      fs.readFile(resourcesDir + 'docs.jade', 'utf8', function(err, contents) {
        if (err != null) return cb(err);
        cb(null, jade.compile(contents));
      });
    },
    docs: function(cb) {
      async.parallel({
        css: async.apply(fs.readFile, resourcesDir + 'docs.css', 'utf8'),
        js: async.apply(fs.readFile, resourcesDir + 'docs.js', 'utf8')
      }, cb);
    },
    // Extra JavaScript and CSS files to include in previews.
    previews: function(cb) {
      fs.readFile(resourcesDir + 'previews.js', 'utf8', function(err, js) {
        if (err != null) return cb(err);
        var code = { js: js, css: '' };
        var files = options.include.filter(
          function(file) { return inArray(['.css', '.js'], path.extname(file)); }
        );
        async.filter(files, path.exists, function(files) {
          async.reduce(files, code, function(tot, cur, cb) {
            fs.readFile(cur, 'utf8', function(err, contents) {
              if (err != null) return cb(err);
              if (path.extname(cur) === '.css') tot.css += contents;
              if (path.extname(cur) === '.js') tot.js += contents;
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
        files = files.filter(function(file) {
          // No hidden files
          if (file.match(/(\/|^)\.[^\.\/]/)) return false;
          // Only supported file types
          if (!(path.extname(file) in fileTypes)) return false;
          return true;
        }).sort();
        if (!files.length) cb(new Error('Failed to process files.'));
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
  }, function(err, resources) {
    if (err != null) throw new SDError('Could not process files.', err);
    var menu = menuLinks(resources.files, options.basePath);
    // Run files through preprocessor and StyleDocco parser.
    async.map(resources.files, function(file, cb) {
      async.parallel({
        css: async.apply(preprocess, file,
               options.preprocessor || fileTypes[path.extname(file)]),
        docs: function(cb) {
          fs.readFile(file, 'utf8', function(err, code) {
            if (err != null) return cb(err);
            cb(null, styledocco(code));
          });
        }
      }, function(err, data) {
        if (err != null) return cb(err);
        data.path = file;
        cb(null, data);
      });
    }, function(err, files) {
      if (err != null) return cb(err);
      // Get the combined CSS from all files.
      var previewStyles = pluck(files, 'css').reduce(add, '');
      previewStyles += resources.previews.css;
      // Build a JSON string of all files and their headings.
      var toc = flatten(files.map(function(file) {
        var arr = [ { title: baseFilename(file.path),
                      url: htmlFilename(file.path, options.basePath) } ];
        return arr.concat(file.docs.map(function(section) {
          return { title: section.title,
                   filename: baseFilename(file.path),
                   url: htmlFilename(file.path, options.basePath) + '#' + section.slug };
        }));
      }));
      toc = 'var toc=' + JSON.stringify(toc) + ';';
      var docsScript = toc + resources.docs.js;
      // Render files
      var htmlFiles = files.map(function(file) {
        return {
          path: file.path,
          html: resources.template({
            title: baseFilename(file.path),
            sections: file.docs,
            project: { name: options.name, menu: menu },
            resources: {
              docs: { js: minjs(docsScript), css: mincss(resources.docs.css) },
              previews: { js: minjs(resources.previews.js), css: mincss(previewStyles) }
            }
          })
        };
      });
      // Add readme with "fake" index path
      htmlFiles.push({
        path: path.join(options.basePath, 'index'),
        html: resources.template({
          title: '',
          sections: styledocco.makeSections([{ docs: resources.readme, code: '' }]),
          project: { name: options.name, menu: menu },
          resources: {
            docs: { js: docsScript, css: resources.docs.css }
          }
        })
      });
      // Write files to the output dir.
      htmlFiles.forEach(function(file) {
        var dest = path.join(options.out, htmlFilename(file.path, options.basePath));
        log('styledocco: writing ' + file.path + ' -> ' + dest);
        fs.writeFileSync(dest, file.html);
      });
    });
  });

/*
    // Write static resources to the output dir
    Object.keys(staticFiles).forEach(function(file) {
      var dest = path.join(options.out, file);
      log('styledocco: writing ' + file + ' -> ' + dest);
      fs.writeFileSync(dest, staticFiles[file]);
    });
  });
  */
};

module.exports = cli;
module.exports.htmlFilename = htmlFilename;
module.exports.menuLinks = menuLinks;
