var fs = require('fs');
var path = require('path');
var findit = require('findit');
var jade = require('jade');
var marked = require('marked');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var langs = require('./languages');
var parser = require('./parser');
var _ = require('./utils');

marked.setOptions({ gfm: true });

if (optimist.argv.version != null) {
  return console.log("StyleDocco " + (require('../package').version));
}

var options = optimist
  .usage('Usage: $0 [options] [INPUT]')
  .describe('name', 'Name of the project').alias('n', 'name').demand('name')
  .describe('out', 'Output directory').alias('o', 'out').default('out', 'docs')
  .describe('resources', 'Directory for static resources').alias('s', 'resources').default('resources', path.resolve(__dirname, '../resources'))
  .describe('preprocessor', 'Custom preprocessor command')
  .describe('include', 'CSS to include on all pages')
  .describe('verbose', 'Display status messages to stdout')
  .describe('version', 'Display StyleDocco version')
  .argv;

var log;
if (options.verbose) {
  log = function(str) {
    return console.log(str);
  };
} else {
  log = function() {};
}

// Get sections of matching doc/code blocks.
var getSections = function(filename) {
  var lang = langs.getLanguage(filename);
  var data = fs.readFileSync(filename, 'utf-8');
  if (lang != null) {
    return parser.makeSections(parser.extractBlocks(lang, data));
  } else {
    return parser.makeSections([{ docs: data, code: '' }]);
  }
};

// Generate the HTML document and write to file.
var generateFile = function(source, data) {
  var dest, root;
  if (source.match(/readme/i)) {
    source = path.join(options["in"], 'index.html');
    dest = _.makeDestination(source, options["in"]);
    root = './';
  } else {
    dest = 'html/' + _.makeDestination(source, options["in"]);
    root = '../';
  }
  data.project = { name: options.name, menu: menu, root: root };

  var render = function(data) {
    var template = fs.readFileSync(templateFile, 'utf-8');
    var html = jade.compile(template, {
      filename: templateFile,
      pretty: true
    })(data);
    log("styledocco: " + source + " -> " + (path.join(options.out, dest)));
    return writeFile(dest, html);
  };

  if (langs.isSupported(source) && options.preprocessor !== 'none') {
    var lang = langs.getLanguage(source);
    return lang.compile(source, options.preprocessor, function(err, css) {
      if (err != null) { throw err; }
      data.css = css + customCss;
      return render(data);
    });
  } else {
    data.css = customCss;
    return render(data);
  }
};

// Write a file to the output dir.
var writeFile = function(dest, contents) {
  dest = path.join(options.out, dest);
  mkdirp.sync(path.dirname(dest));
  return fs.writeFileSync(dest, contents);
};

// Copy a resource to the output directory.
var copyResource = function(fileName) {
  var outPath = path.join(options.out, fileName);
  fs.writeFileSync(outPath, fs.readFileSync(_.getResourcePath(options.resources, fileName), 'utf-8'));
  return log("styledocco: writing " + outPath);
};


options["in"] = options._[0] || './';

// Get all files from input (directory).
var templateFile = _.getResourcePath(options.resources, 'docs.jade');

// Get custom CSS if specified.
var customCss = options.include != null ? fs.readFileSync(options.include, 'utf8') : '';

var sources = findit.sync(options["in"]);

// Filter out unsupported file types.
var files = sources.filter(function(source) {
  if (source.match(/(\/|^)\.[^\.\/]/)) { return false; } // No hidden files
  if (!langs.isSupported(source)) { return false; } // Only supported file types
  if (!fs.statSync(source).isFile()) { return false; } // Files only
  return true;
}).sort();

var menu = _.makeMenu(files, options["in"]);


// Look for a README file and generate an index.html.
var readme = _.findFile(options["in"], /^readme/i)
          || _.findFile(process.cwd(), /^readme/i)
          || _.findFile(options.resources, /^readme/i)
          || path.resolve(__dirname, '../resources/README.md');

var readmeText;
if (readme.match(/\.m(ark)?d(own)?$/i)) {
  readmeText = marked(fs.readFileSync(readme, 'utf-8'));
} else {
  readmeText = fs.readFileSync(readme, 'utf-8');
}

// Generate index file
generateFile(readme, {
  menu: menu,
  sections: [{ docs: readmeText }],
  title: '',
  description: ''
});

// Generate documentation files.
var sections, relFile;
files.forEach(function(file) {
  sections = getSections(file);
  relFile = path.relative(path.resolve(options["in"]), path.resolve(file));
  return generateFile(file, {
    menu: menu,
    sections: sections,
    title: relFile,
    description: ''
  });
});

copyResource('docs.css');
copyResource('docs.js');
