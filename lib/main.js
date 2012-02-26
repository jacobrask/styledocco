(function() {
  var Language, destination, docco_template, ensureDirectory, exec, file_exists, fs, generateDocumentation, generateReadme, generateSourceHtml, getLanguage, jade, languages, makeSections, marked, parseArgs, parse_markdown, path, preProcess, relative_base, walk, writeFile, _;

  exec = require('child_process').exec;

  fs = require('fs');

  path = require('path');

  marked = require('marked');

  jade = require('jade');

  _ = require('underscore');

  walk = require('walk');

  marked.setOptions({
    sanitize: false
  });

  generateDocumentation = function(sourceFile, context, cb) {
    return fs.readFile(sourceFile, "utf-8", function(err, code) {
      var sections;
      if (err) throw err;
      sections = makeSections(getLanguage(sourceFile), code);
      generateSourceHtml(sourceFile, context, sections);
      return cb();
    });
  };

  Language = (function() {

    function Language(symbols, preprocessor) {
      this.symbols = symbols;
      this.preprocessor = preprocessor;
      this.regexs = {};
      if (this.symbols.single) {
        this.regexs.single = new RegExp('^\\s*' + this.symbols.single + '\\s?');
      }
      this.regexs.multi_start = new RegExp(/^[\s]*\/\*[.]*/);
      this.regexs.multi_end = new RegExp(/.*\*\/.*/);
    }

    Language.prototype.checkType = function(str) {
      if (str.match(this.regexs.multi_start)) {
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
      cmd: 'scss',
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

  makeSections = function(lang, data) {
    var code, docs, hasCode, inMulti, line, lines, multiAccum, sections, _i, _len;
    lines = data.split('\n');
    sections = [];
    docs = code = multiAccum = '';
    inMulti = false;
    hasCode = false;
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      if (lang.checkType(line) === 'multistart' || inMulti) {
        if (hasCode) {
          sections.push({
            docs: marked(docs),
            code: code
          });
          docs = code = '';
          hasCode = false;
        }
        inMulti = true;
        multiAccum += line + '\n';
        if (lang.checkType(line) === 'multiend') {
          inMulti = false;
          docs = multiAccum;
          multiAccum = '';
        }
      } else if (lang.checkType(line) === 'single') {
        if (hasCode) {
          hasCode = false;
          sections.push({
            docs: marked(docs),
            code: code
          });
          docs = code = '';
        }
        docs += lang.filter(line) + '\n';
      } else {
        hasCode = true;
        code += line + '\n';
      }
    }
    sections.push({
      docs: marked(docs),
      code: code
    });
    return sections;
  };

  preProcess = function(filename, cb) {
    var lang;
    lang = getLanguage(filename);
    return lang.compile(filename, cb);
  };

  generateSourceHtml = function(source, context, sections) {
    var dest, title;
    title = path.basename(source);
    dest = destination(source, context);
    return preProcess(source, function(err, css) {
      var html;
      if (err) throw err;
      html = docco_template({
        title: title,
        file_path: source,
        sections: sections,
        context: context,
        path: path,
        relative_base: relative_base,
        css: css
      });
      console.log("styledocco: " + source + " -> " + dest);
      return writeFile(dest, html);
    });
  };

  generateReadme = function(context, sources) {
    var content, dest, html, readme_path, readme_template, source, title;
    title = "README";
    dest = "" + context.config.output_dir + "/index.html";
    source = "README.md";
    readme_template = jade.compile(fs.readFileSync(__dirname + '/../resources/readme.jade').toString(), {
      filename: __dirname + '/../resources/readme.jade'
    });
    readme_path = "" + (process.cwd()) + "/" + source;
    content = parse_markdown(context, readme_path) || ("There is no " + source + " for this project yet :( ");
    html = readme_template({
      title: title,
      context: context,
      content: content,
      file_path: source,
      path: path,
      relative_base: relative_base
    });
    console.log("styledocco: " + source + " -> " + dest);
    return writeFile(dest, html);
  };

  writeFile = function(dest, contents) {
    var target_dir, write_func;
    target_dir = path.dirname(dest);
    write_func = function() {
      return fs.writeFile(dest, contents, function(err) {
        if (err) throw err;
      });
    };
    return fs.stat(target_dir, function(err, stats) {
      if (err && err.code !== 'ENOENT') throw err;
      if (!err) return write_func();
      if (err) {
        return exec("mkdir -p " + target_dir, function(err) {
          if (err) throw err;
          return write_func();
        });
      }
    });
  };

  parse_markdown = function(context, src) {
    var data;
    data = fs.readFileSync(src).toString();
    return marked(data);
  };

  getLanguage = function(source) {
    return languages[path.extname(source)];
  };

  relative_base = function(filepath, context) {
    var result;
    result = path.dirname(filepath) + '/';
    if (result === '/' || result === '//') {
      return '';
    } else {
      return result;
    }
  };

  destination = function(filepath, context) {
    var base_path;
    base_path = relative_base(filepath, context);
    return ("" + context.config.output_dir + "/") + base_path + path.basename(filepath, path.extname(filepath)) + '.html';
  };

  ensureDirectory = function(dir, cb) {
    return exec("mkdir -p " + dir, function() {
      return cb();
    });
  };

  file_exists = function(path) {
    try {
      return fs.lstatSync(path).isFile;
    } catch (ex) {
      return false;
    }
  };

  docco_template = jade.compile(fs.readFileSync(__dirname + '/../resources/docs.jade').toString(), {
    filename: __dirname + '/../resources/docs.jade'
  });

  parseArgs = function(cb) {
    var a, args, ext, lang_filter, project_name, roots;
    args = process.ARGV;
    project_name = "";
    if (args[0] === "-name") {
      args.shift();
      project_name = args.shift();
    }
    args = args.sort();
    if (!args.length) return;
    roots = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        a = args[_i];
        _results.push(a.replace(/\/+$/, ''));
      }
      return _results;
    })();
    roots = roots.join(" ");
    lang_filter = (function() {
      var _results;
      _results = [];
      for (ext in languages) {
        _results.push(" -name '*" + ext + "' ");
      }
      return _results;
    })();
    lang_filter = lang_filter.join(' -o ');
    return exec("find " + roots + " -type f \\( " + lang_filter + " \\)", function(err, stdout) {
      var sources;
      if (err) throw err;
      sources = stdout.split("\n").filter(function(file) {
        var filename;
        if (file === '') return false;
        filename = path.basename(file);
        if (filename[0] === '.') return false;
        if (filename.match(/^_.*\.s[ac]ss$/)) return false;
        return true;
      });
      console.log("styledocco: Recursively generating docs underneath " + roots + "/");
      return cb(sources, project_name, args);
    });
  };

  parseArgs(function(sources, project_name, raw_paths) {
    var context;
    context = {
      sources: sources,
      options: {
        project_name: project_name
      }
    };
    context.config = {
      show_timestamp: true,
      output_dir: 'docs',
      project_name: project_name || ''
    };
    return ensureDirectory(context.config.output_dir, function() {
      var files, nextFile;
      generateReadme(context, raw_paths);
      files = sources.slice(0, sources.length + 1 || 9e9);
      nextFile = function() {
        if (files.length) {
          return generateDocumentation(files.shift(), context, nextFile);
        }
      };
      return nextFile();
    });
  });

}).call(this);
