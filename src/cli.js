// vim: set shiftwidth=2 expandtab:
'use strict';

var async = require('async');
var fs = require('fs');
var marked = require('marked');
var mkdirp = require('mkdirp');
var path = require('path');
var util = require('util');

var helper = require('./helper');
var gather = require('./gather');
var extract = require('./extract');
var styledocco = require('./styledocco');
var version = require('../package').version;

marked.setOptions({ sanitize: false, gfm: true });

// TODO:
// Divide code into steps
// 1. gather [done]
// 2. extract [done]
// 3. render

// Helper functions

var dirUp = function(steps) {
    if ( ! steps) return '';
    var str = '';
    for (var i = 0; i < steps; ++i) {
        str += '../';
    }
    return str;
}

// Get a filename without the extension
var baseFilename = function(str) {
  return path.basename(str, path.extname(str)).replace(/^_/, '');
};

var basePathname = function(file, basePath) {
  return path.join(
    path.dirname(path.relative(basePath, file) || path.basename(basePath)),
    baseFilename(file)
  );
};

// Build an HTML file name, named by it's path relative to basePath
var htmlFilename = function(file, basePath) {
  return path.join(
    path.dirname(path.relative(basePath, file) || path.basename(basePath)),
    baseFilename(file) + '.html'
  ).replace(/[\\/]/g, '-');
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

  var errorMessages = { noFiles: 'No css files found' };

  var log = options.verbose ? function(str) { console.log(str); }
                            : function() {};

  // Custom error also outputing StyleDocco and Node versions.
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
  async.parallel(gather(options), function(err, resources) {
    if (err != null) {
      if (err.message.indexOf(errorMessages.noFiles) > -1) {
        console.error(new SDError('Nothing to do.', err).message);
        return;
      } else {
        throw new SDError('Could not process files.', err);
      }
    }
    var menu = menuLinks(resources.files, options.basePath);
    // Run files through preprocessor and StyleDocco parser.
    async.map(resources.files, function(file, cb) {
      async.parallel(extract(options, file), function(err, data) {
        if (err != null) return cb(err);
        data.path = file;
        cb(null, data);
      });
    }, function(err, files) {
      // 3. Render
      if (err != null) throw err;
      // Get the combined CSS from all files.
      var previewStyles = helper.pluck(files, 'css').join('');
      previewStyles += resources.previews.css;
      // Build a JSON string of all files and their headings, for client side search.
      var searchIndex = helper.flatten(files.map(function(file) {
        var arr = [ { title: baseFilename(file.path),
                      filename: basePathname(file.path, options.basePath),
                      url: htmlFilename(file.path, options.basePath) } ];
        return arr.concat(file.docs.map(function(section) {
          return { title: section.title,
                   filename: basePathname(file.path, options.basePath),
                   url: htmlFilename(file.path, options.basePath) + '#' + section.slug };
        }));
      }));
      searchIndex = 'var searchIndex=' + JSON.stringify(searchIndex) + ';';
      var docsScript = '(function(){' + searchIndex + resources.docs.js + '})();';
      // Render files
      var htmlFiles = files.map(function(file) {
        var relativePath = file.path.split('/');
        relativePath.pop();
        relativePath = dirUp(options.out.split('/').length) + relativePath.join('/');
        return {
          path: file.path,
          html: resources.template({
            title: baseFilename(file.path),
            sections: file.docs,
            project: { name: options.name, menu: menu },
            resources: {
              docs: { js: helper.minjs(docsScript), css: helper.mincss(resources.docs.css) },
              previews: { js: helper.minjs(resources.previews.js), css: helper.mincss(helper.urlsRelative(previewStyles, relativePath)) }
            }
          })
        };
      });
      // Add readme with "fake" index path.
      htmlFiles.push({
        path: path.join(options.basePath, 'index'),
        html: resources.template({
          title: '',
          sections: styledocco.makeSections([{ docs: resources.readme, code: '' }]),
          project: { name: options.name, menu: menu },
          resources: {
            docs: { js: helper.minjs(docsScript), css: helper.mincss(resources.docs.css) }
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
};

module.exports = cli;
module.exports.htmlFilename = htmlFilename;
module.exports.menuLinks = menuLinks;
