(function() {
  var buildRootPath, cssPath, currentDir, file, files, findFile, findit, fs, generateSourceHtml, getSections, input, jade, key, langs, link, makeDestination, menu, mkdirp, optimist, options, outputDir, overwriteResources, parser, parts, path, preProcess, readme, renderTemplate, sections, sources, templateDir, writeFile, _, _i, _len;

  fs = require('fs');

  path = require('path');

  mkdirp = require('mkdirp');

  findit = require('findit');

  jade = require('jade');

  optimist = require('optimist');

  langs = require('./languages');

  parser = require('./parser');

  _ = require('./utils');

  options = optimist.usage('Usage: $0 [options] [INPUT]').describe('name', 'Name of the project').alias('n', 'name').demand('name').describe('out', 'Output directory').alias('o', 'out')["default"]('out', 'docs').describe('tmpl', 'Template directory').boolean('overwrite').describe('overwrite', 'Overwrite existing files in target dir').argv;

  input = options._[0] || './';

  currentDir = "" + (process.cwd()) + "/";

  outputDir = options.out;

  templateDir = options.tmpl || ("" + __dirname + "/../resources/");

  overwriteResources = options.overwrite;

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

  makeDestination = function(file) {
    return path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.html');
  };

  buildRootPath = function(str) {
    var root;
    if (path.dirname(str) === '.') {
      root = path.dirname(str);
    } else {
      root = path.dirname(str).replace(/[^\/]+/g, '..');
    }
    if (root.slice(-1) !== '/') root += '/';
    return root;
  };

  preProcess = function(filename, cb) {
    var lang;
    lang = langs.getLanguage(filename);
    return lang.compile(filename, cb);
  };

  renderTemplate = function(templateName, content) {
    var template, templateFile;
    templateFile = "" + templateDir + templateName + ".jade";
    template = fs.readFileSync(templateFile, 'utf-8');
    return jade.compile(template, {
      filename: templateFile
    })(content);
  };

  generateSourceHtml = function(source, data) {
    var dest, render;
    dest = makeDestination(source.replace(/readme/i, 'index'));
    data.project = {
      name: options.name,
      menu: menu,
      root: buildRootPath(source.replace(/readme/i, 'index'))
    };
    render = function(data) {
      var html;
      html = renderTemplate('docs', data);
      console.log("styledocco: " + source + " -> " + (path.join(outputDir, dest)));
      return writeFile(dest, html);
    };
    if (langs.isSupported(source)) {
      return preProcess(source, function(err, css) {
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
    dest = path.join(outputDir, dest);
    mkdirp.sync(path.dirname(dest));
    return fs.writeFileSync(dest, contents);
  };

  mkdirp.sync(outputDir);

  sources = findit.sync(input);

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
      href: makeDestination(file)
    };
    parts = file.split('/').splice(1);
    key = parts.length > 1 ? parts[0] : './';
    if (menu[key] != null) {
      menu[key].push(link);
    } else {
      menu[key] = [link];
    }
  }

  findFile = function(dir, re) {
    var _ref;
    if (!fs.statSync(dir).isDirectory()) return null;
    return (_ref = fs.readdirSync(dir).filter(function(file) {
      return file.match(re);
    })) != null ? _ref[0] : void 0;
  };

  readme = findFile(input, /^readme/i) || findFile(currentDir, /^readme/i) || findFile(templateDir, /^readme/i);

  sections = getSections(readme);

  generateSourceHtml(readme, {
    menu: menu,
    sections: sections,
    title: '',
    description: ''
  });

  files.forEach(function(file) {
    sections = getSections(file);
    return generateSourceHtml(file, {
      menu: menu,
      sections: sections,
      title: '',
      description: ''
    });
  });

  cssPath = path.join(outputDir, 'docs.css');

  if (overwriteResources || !path.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, fs.readFileSync(__dirname + '/../resources/docs.css', 'utf-8'));
    console.log("styledocco: writing " + (path.join(outputDir, 'docs.css')));
  }

}).call(this);
