(function() {
  var Language, exec, fs, languages, path;

  exec = require('child_process').exec;

  fs = require('fs');

  path = require('path');

  Language = (function() {

    function Language(symbols, preprocessor) {
      this.symbols = symbols;
      this.preprocessor = preprocessor;
      this.regexs = {};
      if (this.symbols.single) {
        this.regexs.single = new RegExp('^\\s*' + this.symbols.single);
      }
      this.regexs.multi_start = new RegExp(/^[\s]*\/\*/);
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

  exports.languages = languages = {
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

  exports.getLanguage = function(source) {
    return languages[path.extname(source)];
  };

}).call(this);
