(function() {
  var Language, buildRootPath, exec, files, findit, fs, generateIndex, generateSourceHtml, getLanguage, inputDir, jade, languages, links, makeDestination, makeSections, marked, mkdirp, optimist, options, outputDir, path, preProcess, renderTemplate, sources, templateDir, trimNewLines, writeFile;

  exec = require('child_process').exec;

  fs = require('fs');

  path = require('path');

  marked = require('marked');

  mkdirp = require('mkdirp');

  findit = require('findit');

  jade = require('jade');

  optimist = require('optimist');

  options = optimist.usage('Usage: $0 [options] [INPUT]').describe('name', 'Name of the project').alias('n', 'name').demand('name').describe('tmpl', 'Template directory').describe('out', 'Output directory').alias('o', 'out')["default"]('out', 'docs').argv;

  inputDir = options._[0] || './';

  outputDir = options.out;

  templateDir = options.tmpl || ("" + __dirname + "/../resources/");

  marked.setOptions({
    sanitize: false
  });

  Language = (function() {

    function Language(symbols, preprocessor) {
      this.symbols = symbols;
      this.preprocessor = preprocessor;
      this.regexs = {};
      if (this.symbols.single) {
        this.regexs.single = new RegExp('^\\s*' + this.symbols.single);
      }
      this.regexs.multi_start = new RegExp(/^[\s]*\/\*[.]*/);
      this.regexs.multi_end = new RegExp(/\*\//);
    }

    Language.prototype.checkType = function(str) {
      if (str.match(this.regexs.multi_start) && str.match(this.regexs.multi_end)) {
        return 'single';
      } else if (str.match(this.regexs.multi_start)) {
        return 'multistart';
      } else if (str.match(this.regexs.multi_end)) {
        return 'multiend';
      } else if ((this.regexs.single != null) && str.match(this.regexs.single)) {
        return 'single';
      } else {
        return 'code';
      }
    };

    Language.prototype.filter = function(str) {
      var n, re, _ref;
      _ref = this.regexs;
      for (n in _ref) {
        re = _ref[n];
        str = str.replace(re, '');
      }
      return str;
    };

    Language.prototype.compile = function(filename, cb) {
      if (this.preprocessor != null) {
        return exec("" + this.preprocessor.cmd + " " + (this.preprocessor.args.join(' ')) + " " + filename, function(err, stdout, stderr) {
          return cb(err, stdout);
        });
      } else {
        return fs.readFile(filename, 'utf-8', function(err, data) {
          return cb(err, data);
        });
      }
    };

    return Language;

  })();

  languages = {
    '.css': new Language({
      multi: ["/*", "*/"]
    }),
    '.scss': new Language({
      single: '//',
      multi: ["/*", "*/"]
    }, {
      cmd: 'scss',
      args: ['-t', 'compressed']
    }),
    '.sass': new Language({
      single: '//',
      multi: ["/*", "*/"]
    }, {
      cmd: 'sass',
      args: ['-t', 'compressed']
    }),
    '.less': new Language({
      single: '//',
      multi: ["/*", "*/"]
    }, {
      cmd: 'lessc',
      args: ['-x']
    }),
    '.styl': new Language({
      single: '//',
      multi: ["/*", "*/"]
    }, {
      cmd: 'stylus',
      args: ['-c', '<']
    })
  };

  getLanguage = function(source) {
    return languages[path.extname(source)];
  };

  trimNewLines = function(str) {
    return str.replace(/^\n*/, '').replace(/\n*$/, '');
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
    lang = getLanguage(filename);
    return lang.compile(filename, cb);
  };

  makeSections = function(lang, data) {
    var code, docs, formatCode, formatDocs, line, lines, sections;
    lines = data.split('\n');
    sections = [];
    formatDocs = function(line) {
      return "" + (lang.filter(line)) + "\n";
    };
    formatCode = function(line) {
      return "" + line + "\n";
    };
    while (lines.length) {
      docs = code = '';
      while (lines.length && lang.checkType(lines[lines.length - 1]) === 'code') {
        code = formatCode(lines.pop()) + code;
      }
      while (lines.length && lang.checkType(lines[lines.length - 1]) === 'single') {
        docs = formatDocs(lines.pop()) + docs;
      }
      if (lines.length && lang.checkType(lines[lines.length - 1]) === 'multiend') {
        while (lines.length) {
          line = lines.pop();
          docs = formatDocs(line) + docs;
          if (lang.checkType(line) === 'multistart') break;
        }
      }
      sections.push({
        docs: marked(trimNewLines(docs)),
        code: trimNewLines(code)
      });
    }
    return sections.reverse();
  };

  renderTemplate = function(templateName, content) {
    var template, templateFile;
    templateFile = "" + templateDir + templateName + ".jade";
    template = fs.readFileSync(templateFile, 'utf-8');
    return jade.compile(template, {
      filename: templateFile
    })(content);
  };

  generateSourceHtml = function(source, links, sections) {
    var dest;
    dest = makeDestination(source);
    links = links.map(function(link) {
      if (link.path === source) link["class"] = 'is-active';
      return link;
    });
    return preProcess(source, function(err, css) {
      var data, html;
      if (err != null) throw err;
      data = {
        title: "" + options.name + " – " + source,
        project: {
          name: options.name,
          links: links,
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

  generateIndex = function(links) {
    var content, currentDir, data, dest, files, html;
    currentDir = "" + (process.cwd()) + "/";
    dest = "index.html";
    files = fs.readdirSync(currentDir).filter(function(file) {
      return file.toLowerCase().match(/^readme/);
    });
    content = files[0] != null ? marked(fs.readFileSync(currentDir + files[0], 'utf-8')) : "<h1>Readme</h1><p>Please add a README file to this project.</p>";
    data = {
      title: options.name,
      project: {
        name: options.name,
        links: links,
        root: './'
      },
      content: content
    };
    html = renderTemplate('readme', data);
    console.log("styledocco: " + (files[0] || './') + " -> " + (path.join(outputDir, dest)));
    return writeFile(dest, html);
  };

  writeFile = function(dest, contents) {
    dest = path.join(outputDir, dest);
    mkdirp.sync(path.dirname(dest));
    return fs.writeFileSync(dest, contents);
  };

  mkdirp.sync(outputDir);

  sources = findit.sync(inputDir);

  files = sources.filter(function(source) {
    if (source.match(/(\/|^)\./)) return false;
    if (source.match(/(\/|^)_.*\.s[ac]ss$/)) return false;
    if (!(path.extname(source) in languages)) return false;
    if (!fs.statSync(source).isFile()) return false;
    return true;
  });

  links = files.sort().map(function(file) {
    return {
      name: path.basename(file, path.extname(file)),
      path: file,
      href: makeDestination(file),
      "class": null
    };
  });

  generateIndex(links);

  files.forEach(function(file) {
    var code, sections;
    code = fs.readFileSync(file, "utf-8");
    sections = makeSections(getLanguage(file), code);
    return generateSourceHtml(file, links, sections);
  });

}).call(this);
