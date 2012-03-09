(function() {
  var buildRootPath, cssPath, currentDir, description, file, files, findFile, findit, fs, generateSourceHtml, highlight, input, jade, key, langs, link, makeDestination, marked, menu, mkdirp, optimist, options, outputDir, overwriteResources, parser, parts, path, preProcess, readme, renderTemplate, sources, templateDir, title, tokens, writeFile, _, _i, _len;

  fs = require('fs');

  path = require('path');

  highlight = require('highlight.js');

  marked = require('marked');

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

  marked.setOptions({
    sanitize: false,
    gfm: true
  });

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

  generateSourceHtml = function(source, menu, sections, title, description) {
    var data, dest, render;
    dest = makeDestination(source);
    render = function() {
      var html;
      html = renderTemplate('docs', data);
      console.log("styledocco: " + source + " -> " + (path.join(outputDir, dest)));
      return writeFile(dest, html);
    };
    data = {
      title: title,
      description: description,
      project: {
        name: options.name,
        menu: menu,
        root: buildRootPath(source)
      },
      sections: sections,
      css: ''
    };
    if (langs.isSupported(source)) {
      return preProcess(source, function(err, css) {
        if (err != null) throw err;
        data.css = css;
        return render();
      });
    } else {
      return render();
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

  tokens = marked.lexer(fs.readFileSync(readme, 'utf-8'));

  title = parser.getTitle(tokens);

  if (title != null) {
    tokens.shift();
    description = parser.getDescription(tokens);
    if (description != null) tokens.shift();
  } else {
    title = options.name;
  }

  generateSourceHtml(readme, menu, parser.makeSections(tokens).map(function(section) {
    return marked.parser(section);
  }), title, description);

  files.forEach(function(file) {
    var code, diff, i, newToken, origTokens, sections, token, _len2, _len3;
    code = fs.readFileSync(file, "utf-8");
    tokens = marked.lexer(parser.getDocs(langs.getLanguage(file), code));
    title = parser.getTitle(tokens);
    if (title != null) {
      tokens.shift();
      description = parser.getDescription(tokens);
      if (description != null) tokens.shift();
    } else {
      title = path.basename(file, path.extname(file));
    }
    origTokens = tokens.slice(0);
    for (i = 0, _len2 = origTokens.length; i < _len2; i++) {
      token = origTokens[i];
      if (!(token.type === 'code')) continue;
      diff = tokens.length - origTokens.length;
      newToken = {
        type: 'html',
        pre: false,
        text: "<div class=\"styledocco-example\">" + token.text + "</div>"
      };
      tokens.splice(i + diff, 0, newToken);
    }
    for (i = 0, _len3 = tokens.length; i < _len3; i++) {
      token = tokens[i];
      if (!(token.type === 'code')) continue;
      token.text = highlight.highlightAuto(token.text).value;
      token.escaped = true;
    }
    sections = parser.makeSections(tokens).map(function(section) {
      return marked.parser(section);
    });
    return generateSourceHtml(file, menu, sections, title, description);
  });

  cssPath = path.join(outputDir, 'docs.css');

  if (overwriteResources || !path.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, fs.readFileSync(__dirname + '/../resources/docs.css', 'utf-8'));
    console.log("styledocco: writing " + (path.join(outputDir, 'docs.css')));
  }

}).call(this);
