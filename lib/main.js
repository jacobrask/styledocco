(function() {
  var buildRootPath, cssPath, file, files, findit, fs, generateIndex, generateSourceHtml, input, jade, key, langs, link, makeDestination, marked, menu, mkdirp, optimist, options, outputDir, overwriteResources, parser, parts, path, preProcess, renderTemplate, sources, templateDir, writeFile, _, _i, _len;

  fs = require('fs');

  path = require('path');

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
    var dest;
    dest = makeDestination(source);
    return preProcess(source, function(err, css) {
      var data, html;
      if (err != null) throw err;
      data = {
        title: title,
        description: description,
        project: {
          name: options.name,
          menu: menu,
          root: buildRootPath(source)
        },
        sections: sections,
        css: css
      };
      html = renderTemplate('docs', data);
      console.log("styledocco: " + source + " -> " + (path.join(outputDir, dest)));
      return writeFile(dest, html);
    });
  };

  generateIndex = function(menu) {
    var content, currentDir, data, dest, files, html, readme;
    currentDir = "" + (process.cwd()) + "/";
    dest = "index.html";
    if (fs.statSync(input).isDirectory()) {
      files = fs.readdirSync(input).filter(function(file) {
        return file.toLowerCase().match(/^readme/);
      });
      if (files[0] != null) readme = path.join(input, files[0]);
    }
    if (readme == null) {
      files = fs.readdirSync(currentDir).filter(function(file) {
        return file.toLowerCase().match(/^readme/);
      });
      if (files[0] != null) readme = path.join(currentDir, files[0]);
    }
    content = readme != null ? marked(fs.readFileSync(readme, 'utf-8')) : "<h1>Readme</h1><p>Please add a README file to this project.</p>";
    data = {
      title: options.name,
      project: {
        name: options.name,
        menu: menu,
        root: './'
      },
      content: content
    };
    html = renderTemplate('index', data);
    console.log("styledocco: " + (files[0] || './') + " -> " + (path.join(outputDir, dest)));
    return writeFile(dest, html);
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

  generateIndex(menu);

  files.forEach(function(file) {
    var code, description, diff, i, newToken, origTokens, section, sections, title, token, tokens, _len2;
    code = fs.readFileSync(file, "utf-8");
    tokens = marked.lexer(parser.getDocs(langs.getLanguage(file), code));
    if (tokens[0].type === 'heading' && tokens[0].depth === 1) {
      title = tokens[0].text;
      tokens.shift();
      if (tokens[0].type === 'paragraph') {
        description = tokens[0].text;
        tokens.shift();
      }
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
    sections = [];
    while (tokens.length) {
      if (tokens[0].type === 'heading' && tokens[0].depth <= 2) {
        if (typeof section !== "undefined" && section !== null ? section.length : void 0) {
          sections.push(marked.parser(section));
        }
        section = [tokens.shift()];
      } else {
        (section != null ? section : section = []).push(tokens.shift());
        if (tokens.length === 1) sections.push(marked.parser(section));
      }
    }
    return generateSourceHtml(file, menu, sections, title, description);
  });

  cssPath = path.join(outputDir, 'docs.css');

  if (overwriteResources || !path.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, fs.readFileSync(__dirname + '/../resources/docs.css', 'utf-8'));
    console.log("styledocco: writing " + (path.join(outputDir, 'docs.css')));
  }

}).call(this);
