(function() {
  var cssPath, file, files, findFile, findit, fs, generateFile, getSections, jade, key, langs, link, menu, mkdirp, optimist, options, parser, parts, path, readme, sections, sources, writeFile, _, _i, _len;

  fs = require('fs');

  path = require('path');

  mkdirp = require('mkdirp');

  findit = require('findit');

  jade = require('jade');

  optimist = require('optimist');

  langs = require('./languages');

  parser = require('./parser');

  _ = require('./utils');

  options = optimist.usage('Usage: $0 [options] [INPUT]').describe('name', 'Name of the project').alias('n', 'name').demand('name').describe('out', 'Output directory').alias('o', 'out')["default"]('out', 'docs').describe('tmpl', 'Template directory')["default"]('tmpl', "" + __dirname + "/../resources/").describe('overwrite', 'Overwrite existing files in target dir').boolean('overwrite').describe('nocss', 'Hide CSS code pane').boolean('nocss')["default"]('nocss', false).describe('preprocessor', 'Custom preprocessor command').argv;

  options["in"] = options._[0] || './';

  getSections = function(filename) {
    var blocks, data, lang, sections;
    data = fs.readFileSync(filename, "utf-8");
    lang = langs.getLanguage(filename);
    if (lang != null) {
      blocks = parser.extractBlocks(lang, data);
      sections = parser.makeSections(blocks);
    } else {
      sections = parser.makeSections([
        {
          docs: data,
          code: ''
        }
      ]);
    }
    return sections;
  };

  findFile = function(dir, re) {
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

  generateFile = function(source, data) {
    var dest, lang, render;
    if (source.match(/readme/i)) source = 'index.html';
    dest = _.makeDestination(source);
    data.project = {
      name: options.name,
      menu: menu,
      root: _.buildRootPath(source),
      nocss: options.nocss
    };
    render = function(data) {
      var html, template, templateFile;
      templateFile = path.join(options.tmpl, 'docs.jade');
      template = fs.readFileSync(templateFile, 'utf-8');
      html = jade.compile(template, {
        filename: templateFile
      })(data);
      console.log("styledocco: " + source + " -> " + (path.join(options.out, dest)));
      return writeFile(dest, html);
    };
    if (langs.isSupported(source)) {
      lang = langs.getLanguage(source);
      return lang.compile(source, options.preprocessor, function(err, css) {
        if (err != null) throw err;
        data.css = css;
        return render(data);
      });
    } else {
      data.css = '';
      return render(data);
    }
  };

  writeFile = function(dest, contents) {
    dest = path.join(options.out, dest);
    mkdirp.sync(path.dirname(dest));
    return fs.writeFileSync(dest, contents);
  };

  mkdirp.sync(options.out);

  sources = findit.sync(options["in"]);

  files = sources.filter(function(source) {
    if (source.match(/(\/|^)\./)) return false;
    if (source.match(/(\/|^)_.*\.s[ac]ss$/)) return false;
    if (!langs.isSupported(source)) return false;
    if (!fs.statSync(source).isFile()) return false;
    return true;
  }).sort();

  menu = {};

  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    link = {
      name: path.basename(file, path.extname(file)),
      href: _.makeDestination(file)
    };
    parts = file.split('/').splice(1);
    key = parts.length > 1 ? parts[0] : './';
    if (menu[key] != null) {
      menu[key].push(link);
    } else {
      menu[key] = [link];
    }
  }

  readme = findFile(options["in"], /^readme/i) || findFile(process.cwd(), /^readme/i) || findFile(options.tmpl, /^readme/i);

  sections = getSections(readme);

  generateFile(readme, {
    menu: menu,
    sections: sections,
    title: '',
    description: ''
  });

  files.forEach(function(file) {
    sections = getSections(file);
    return generateFile(file, {
      menu: menu,
      sections: sections,
      title: file,
      description: ''
    });
  });

  cssPath = path.join(options.out, 'docs.css');

  if (options.overwrite || !path.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, fs.readFileSync(path.join(options.tmpl, 'docs.css'), 'utf-8'));
    console.log("styledocco: writing " + (path.join(options.out, 'docs.css')));
  }

}).call(this);
