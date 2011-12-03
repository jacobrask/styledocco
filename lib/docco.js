(function() {
  var check_config, cloc, destination, docco_styles, docco_template, dox, dox_template, ensure_directory, exec, ext, file_exists, fs, generate_documentation, generate_html, generate_readme, get_language, gravatar, highlight, highlight_end, highlight_start, jade, l, languages, parse, parse_args, path, relative_base, showdown, spawn, _ref;

  generate_documentation = function(source, context, callback) {
    return fs.readFile(source, "utf-8", function(error, code) {
      var sections;
      if (error) throw error;
      sections = parse(source, code);
      return highlight(source, sections, function() {
        generate_html(source, context, sections);
        return callback();
      });
    });
  };

  parse = function(source, code) {
    var code_text, docs_text, has_code, in_multi, language, line, lines, multi_accum, parsed, save, sections, _i, _len;
    lines = code.split('\n');
    sections = [];
    language = get_language(source);
    has_code = docs_text = code_text = '';
    in_multi = false;
    multi_accum = "";
    save = function(docs, code) {
      return sections.push({
        docs_text: docs,
        code_text: code
      });
    };
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      if (line.match(language.multi_start_matcher) || in_multi) {
        if (has_code) {
          save(docs_text, code_text);
          has_code = docs_text = code_text = '';
        }
        in_multi = true;
        multi_accum += line + '\n';
        if (line.match(language.multi_end_matcher)) {
          in_multi = false;
          try {
            parsed = dox.parseComments(multi_accum)[0];
            docs_text += dox_template(parsed);
          } catch (error) {
            console.log("Error parsing comments with Dox: " + error);
            docs_text = multi_accum;
          }
          multi_accum = '';
        }
      } else if (line.match(language.comment_matcher) && !line.match(language.comment_filter)) {
        if (has_code) {
          save(docs_text, code_text);
          has_code = docs_text = code_text = '';
        }
        docs_text += line.replace(language.comment_matcher, '') + '\n';
      } else {
        has_code = true;
        code_text += line + '\n';
      }
    }
    save(docs_text, code_text);
    return sections;
  };

  highlight = function(source, sections, callback) {
    var language, output, pygments, section;
    language = get_language(source);
    pygments = spawn('pygmentize', ['-l', language.name, '-f', 'html', '-O', 'encoding=utf-8,tabsize=2']);
    output = '';
    pygments.stderr.addListener('data', function(error) {
      if (error) return console.error(error.toString());
    });
    pygments.stdin.addListener('error', function(error) {
      console.error("Could not use Pygments to highlight the source.");
      return process.exit(1);
    });
    pygments.stdout.addListener('data', function(result) {
      if (result) return output += result;
    });
    pygments.addListener('exit', function() {
      var fragments, i, section, _len;
      output = output.replace(highlight_start, '').replace(highlight_end, '');
      fragments = output.split(language.divider_html);
      for (i = 0, _len = sections.length; i < _len; i++) {
        section = sections[i];
        section.code_html = highlight_start + fragments[i] + highlight_end;
        section.docs_html = showdown.makeHtml(section.docs_text);
      }
      return callback();
    });
    if (pygments.stdin.writable) {
      pygments.stdin.write(((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section = sections[_i];
          _results.push(section.code_text);
        }
        return _results;
      })()).join(language.divider_text));
      return pygments.stdin.end();
    }
  };

  generate_html = function(source, context, sections) {
    var dest, html, target_dir, title, write_func;
    title = path.basename(source);
    dest = destination(source, context);
    html = docco_template({
      title: title,
      file_path: source,
      sections: sections,
      context: context,
      path: path,
      relative_base: relative_base
    });
    target_dir = path.dirname(dest);
    write_func = function() {
      console.log("docco: " + source + " -> " + dest);
      return fs.writeFile(dest, html, function(err) {
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

  generate_readme = function(context, sources, package_json) {
    var content, dest, readme_markdown, readme_path, readme_template, source, title;
    title = "README";
    dest = "docs/readme.html";
    source = "README.md";
    readme_template = jade.compile(fs.readFileSync(__dirname + '/../resources/readme.jade').toString(), {
      filename: __dirname + '/../resources/readme.jade'
    });
    readme_path = process.cwd() + '/README.md';
    readme_markdown = file_exists(readme_path) ? fs.readFileSync(readme_path).toString() : "There is no README.md for this project yet :( ";
    content = showdown.makeHtml(readme_markdown);
    return cloc(sources.join(" "), function(code_stats) {
      var html, target_dir, write_func;
      html = readme_template({
        title: title,
        context: context,
        content: content,
        file_path: source,
        path: path,
        relative_base: relative_base,
        package_json: package_json,
        code_stats: code_stats,
        gravatar: gravatar
      });
      target_dir = path.dirname(dest);
      write_func = function() {
        console.log("docco: " + source + " -> " + dest);
        return fs.writeFile(dest, html, function(err) {
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
    });
  };

  cloc = function(paths, callback) {
    return exec("" + __dirname + "/../vendor/cloc.pl --quiet --read-lang-def=" + __dirname + "/../resources/cloc_definitions.txt " + paths, function(err, stdout) {
      if (err) console.log("Calculating project stats failed " + err);
      return callback(stdout);
    });
  };

  fs = require('fs');

  path = require('path');

  showdown = require('./../vendor/showdown').Showdown;

  jade = require('jade');

  dox = require('dox');

  gravatar = require('gravatar');

  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;

  languages = {
    '.coffee': {
      name: 'coffee-script',
      symbol: '#'
    },
    '.js': {
      name: 'javascript',
      symbol: '//',
      multi_start: "/*",
      multi_end: "*/"
    },
    '.rb': {
      name: 'ruby',
      symbol: '#'
    },
    '.py': {
      name: 'python',
      symbol: '#'
    },
    '.java': {
      name: 'java',
      symbol: '//',
      multi_start: "/*",
      multi_end: "*/"
    }
  };

  for (ext in languages) {
    l = languages[ext];
    l.comment_matcher = new RegExp('^\\s*' + l.symbol + '\\s?');
    l.comment_filter = new RegExp('(^#![/]|^\\s*#\\{)');
    l.divider_text = '\n' + l.symbol + 'DIVIDER\n';
    l.divider_html = new RegExp('\\n*<span class="c1?">' + l.symbol + 'DIVIDER<\\/span>\\n*');
    if (l.multi_start === "/*") {
      l.multi_start_matcher = new RegExp(/^[\s]*\/\*[.]*/);
    } else {
      l.multi_start_matcher = new RegExp(/a^/);
    }
    if (l.multi_end === "*/") {
      l.multi_end_matcher = new RegExp(/.*\*\/.*/);
    } else {
      l.multi_end_matcher = new RegExp(/a^/);
    }
  }

  get_language = function(source) {
    return languages[path.extname(source)];
  };

  relative_base = function(filepath, context) {
    var result;
    result = path.dirname(filepath) + '/';
    if (result === '/') {
      return '';
    } else {
      return result;
    }
  };

  destination = function(filepath, context) {
    var base_path;
    base_path = relative_base(filepath, context);
    return 'docs/' + base_path + path.basename(filepath, path.extname(filepath)) + '.html';
  };

  ensure_directory = function(dir, callback) {
    return exec("mkdir -p " + dir, function() {
      return callback();
    });
  };

  file_exists = function(path) {
    try {
      return fs.lstatSync(path).isFile;
    } catch (ex) {
      return false;
    }
  };

  docco_template = jade.compile(fs.readFileSync(__dirname + '/../resources/docco.jade').toString(), {
    filename: __dirname + '/../resources/docco.jade'
  });

  dox_template = jade.compile(fs.readFileSync(__dirname + '/../resources/dox.jade').toString(), {
    filename: __dirname + '/../resources/dox.jade'
  });

  docco_styles = fs.readFileSync(__dirname + '/../resources/docco.css').toString();

  highlight_start = '<div class="highlight"><pre>';

  highlight_end = '</pre></div>';

  parse_args = function(callback) {
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
        return file !== '' && path.basename(file)[0] !== '.';
      });
      console.log("docco: Recursively generating docs underneath " + roots + "/");
      return callback(sources, project_name, args);
    });
  };

  check_config = function(context, pkg) {
    var defaults, pkg_cfg;
    defaults = {
      css: __dirname + '/../resources/docco.css',
      show_timestamp: true
    };
    context.config = {};
    if (pkg.docco_configuration == null) {
      return context.config = defaults;
    } else {
      pkg_cfg = pkg.docco_configuration;
      if (pkg_cfg.css != null) {
        context.config.css = pkg_cfg.css;
      } else {
        context.config.css = defaults.css;
      }
      if (pkg_cfg.show_timestamp != null) {
        return context.config.show_timestamp = pkg_cfg.show_timestamp;
      } else {
        return context.config.show_timestamp = defaults.show_timestamp;
      }
    }
  };

  parse_args(function(sources, project_name, raw_paths) {
    var context, package_json, package_path;
    context = {
      sources: sources,
      project_name: project_name
    };
    package_path = process.cwd() + '/package.json';
    package_json = file_exists(package_path) ? JSON.parse(fs.readFileSync(package_path).toString()) : {};
    check_config(context, package_json);
    return ensure_directory('docs', function() {
      var files, next_file;
      generate_readme(context, raw_paths, package_json);
      fs.writeFile('docs/docco.css', fs.readFileSync(context.config.css).toString());
      files = sources.slice(0, sources.length + 1 || 9e9);
      next_file = function() {
        if (files.length) {
          return generate_documentation(files.shift(), context, next_file);
        }
      };
      return next_file();
    });
  });

}).call(this);
