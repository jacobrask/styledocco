(function() {
  var check_config, content_template, destination, docco_styles, docco_template, ensure_directory, exec, ext, file_exists, fs, generateDocumentation, generate_content, generate_readme, generate_source_html, get_language, gravatar, highlight_end, highlight_start, jade, l, languages, parse, parse_args, parse_markdown, path, relative_base, showdown, spawn, walk, write_file, _, _ref;

  fs = require('fs');

  path = require('path');

  showdown = require('./../vendor/showdown').Showdown;

  jade = require('jade');

  gravatar = require('gravatar');

  _ = require('underscore');

  walk = require('walk');

  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;

  generateDocumentation = function(sourceFile, context, cb) {
    return fs.readFile(sourceFile, "utf-8", function(err, code) {
      var sections;
      if (err) throw err;
      sections = parse(get_language(sourceFile), code);
      generate_source_html(sourceFile, context, sections);
      return cb();
    });
  };

  parse = function(language, data) {
    var code, docs, hasCode, inMulti, line, lines, multiAccum, save, sections, _i, _len;
    lines = data.split('\n');
    sections = [];
    docs = code = '';
    inMulti = false;
    hasCode = false;
    multiAccum = '';
    save = function(docs, code) {
      return sections.push({
        docs_text: docs,
        docs_html: showdown.makeHtml(docs),
        code_text: code,
        code_html: highlight_start + code + highlight_end
      });
    };
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      if (line.match(language.multi_start_matcher) || inMulti) {
        if (hasCode) {
          save(docs, code);
          docs = code = '';
          hasCode = false;
        }
        inMulti = true;
        multiAccum += line + '\n';
        if (line.match(language.multi_end_matcher)) {
          inMulti = false;
          docs = multiAccum;
          multiAccum = '';
        }
      } else if (line.match(language.comment_matcher) && !line.match(language.comment_filter)) {
        if (hasCode) {
          save(docs, code);
          hasCode = docs = code = '';
        }
        docs += line.replace(language.comment_matcher, '') + '\n';
      } else {
        hasCode = true;
        code += line + '\n';
      }
    }
    save(docs, code);
    return sections;
  };

  generate_source_html = function(source, context, sections) {
    var dest, html, title;
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
    console.log("docco: " + source + " -> " + dest);
    return write_file(dest, html);
  };

  generate_readme = function(context, sources, package_json) {
    var content, content_index, content_index_path, dest, html, readme_path, readme_template, source, title;
    title = "README";
    dest = "" + context.config.output_dir + "/index.html";
    source = "README.md";
    readme_template = jade.compile(fs.readFileSync(__dirname + '/../resources/readme.jade').toString(), {
      filename: __dirname + '/../resources/readme.jade'
    });
    readme_path = "" + (process.cwd()) + "/" + source;
    content_index_path = "" + (process.cwd()) + "/" + context.config.content_dir + "/content_index.md";
    if (file_exists(content_index_path)) {
      content_index = parse_markdown(context, content_index_path);
    } else {
      content_index = "";
    }
    content = parse_markdown(context, readme_path) || ("There is no " + source + " for this project yet :( ");
    html = readme_template({
      title: title,
      context: context,
      content: content,
      content_index: content_index,
      file_path: source,
      path: path,
      relative_base: relative_base,
      package_json: package_json,
      gravatar: gravatar
    });
    console.log("docco: " + source + " -> " + dest);
    return write_file(dest, html);
  };

  generate_content = function(context, dir) {
    var walker;
    walker = walk.walk(dir, {
      followLinks: false
    });
    return walker.on('file', function(root, fileStats, next) {
      var dest, html, src;
      if (fileStats.name.match(new RegExp(".md$"))) {
        src = "" + root + "/" + fileStats.name;
        dest = destination(src.replace(context.config.content_dir, ""), context);
        console.log("markdown: " + src + " --> " + dest);
        html = parse_markdown(context, src);
        html = content_template({
          title: fileStats.name,
          context: context,
          content: html,
          file_path: fileStats.name,
          path: path,
          relative_base: relative_base
        });
        write_file(dest, html);
      }
      return next();
    });
  };

  write_file = function(dest, contents) {
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
    var markdown;
    markdown = fs.readFileSync(src).toString();
    return showdown.makeHtml(markdown);
  };

  languages = {
    '.css': {
      name: 'css',
      symbol: '//',
      multi_start: "/*",
      multi_end: "*/"
    },
    '.scss': {
      name: 'scss',
      symbol: '//',
      multi_start: "/*",
      multi_end: "*/"
    },
    '.less': {
      name: 'less',
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

  content_template = jade.compile(fs.readFileSync(__dirname + '/../resources/content.jade').toString(), {
    filename: __dirname + '/../resources/content.jade'
  });

  docco_styles = fs.readFileSync(__dirname + '/../resources/docco.css').toString();

  highlight_start = '<pre><code>';

  highlight_end = '</code></pre>';

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
    var defaults;
    defaults = {
      css: __dirname + '/../resources/docco.css',
      show_timestamp: true,
      output_dir: "docs",
      project_name: context.options.project_name || '',
      content_dir: null
    };
    return context.config = _.extend(defaults, pkg.docco_husky || {});
  };

  parse_args(function(sources, project_name, raw_paths) {
    var context, package_json, package_path;
    context = {
      sources: sources,
      options: {
        project_name: project_name
      }
    };
    package_path = process.cwd() + '/package.json';
    try {
      package_json = file_exists(package_path) ? JSON.parse(fs.readFileSync(package_path).toString()) : {};
    } catch (err) {
      console.log("Error parsing package.json");
      console.log(err);
    }
    check_config(context, package_json);
    return ensure_directory(context.config.output_dir, function() {
      var files, next_file;
      generate_readme(context, raw_paths, package_json);
      fs.writeFile("" + context.config.output_dir + "/docco.css", fs.readFileSync(context.config.css).toString());
      files = sources.slice(0, sources.length + 1 || 9e9);
      next_file = function() {
        if (files.length) {
          return generateDocumentation(files.shift(), context, next_file);
        }
      };
      next_file();
      if (context.config.content_dir) {
        return generate_content(context, context.config.content_dir);
      }
    });
  });

}).call(this);
