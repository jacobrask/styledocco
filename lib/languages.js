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
        this.regexs.single = new RegExp('^' + this.symbols.single);
      }
      this.regexs.multiStart = new RegExp('^\\' + this.symbols.multi[0].split('').join('\\'));
      this.regexs.multiEnd = new RegExp('\\' + this.symbols.multi[1].split('').join('\\'));
    }

    Language.prototype.checkType = function(str) {
      if (str.match(this.regexs.multiStart) && str.match(this.regexs.multiEnd)) {
        return 'single';
      } else if (str.match(this.regexs.multiStart)) {
        return 'multistart';
      } else if (str.match(this.regexs.multiEnd)) {
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

    Language.prototype.compile = function(filename, customPreprocessor, cb) {
      var preCmd;
      if ((this.preprocessor != null) || customPreprocessor) {
        if (customPreprocessor != null) {
          preCmd = "" + customPreprocessor + " " + filename;
        } else {
          preCmd = "" + this.preprocessor.cmd + " " + (this.preprocessor.args.join(' ')) + " " + filename;
        }
        return exec(preCmd, function(err, stdout, stderr) {
          if (err != null) {
            return cb(new Error("There was an error processing " + filename + ".\n" + (err.message || stderr)));
          }
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

  exports.isSupported = function(filename) {
    return path.extname(filename) in languages;
  };

  exports.getLanguage = function(filename) {
    return languages[path.extname(filename)];
  };

}).call(this);
