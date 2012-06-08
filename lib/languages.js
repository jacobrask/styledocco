// Stylesheet languages
// ====================

var exec = require('child_process').exec;
var fs   = require('fs');
var path = require('path');

var Language = function(symbols, preprocessor) {
  this.symbols = symbols;
  this.preprocessor = preprocessor;
  this.regexs = {};

  // We match only comments without any code on the same line.
  if (this.symbols.single) {
    this.regexs.single = new RegExp('^' + this.symbols.single);
  }

  // All characters in comment symbols need escaping, so build regex's by
  // splitting string and then joining with escape chars.
  this.regexs.multiStart = new RegExp(
    '^\\' + this.symbols.multi[0].split('').join('\\')
  );
  this.regexs.multiEnd   = new RegExp(
    '\\' + this.symbols.multi[1].split('').join('\\')
  );
};

// Find out if a string is code or a comment (and which type of comment).
Language.prototype.checkType = function(str) {
  var type;
  // Treat multi start and end on same row as a single line comment.
  if (str.match(this.regexs.multiStart) && str.match(this.regexs.multiEnd)) {
    type = 'single';
  // Checking for multi line comments first to avoid matching single line
  // comment symbols inside multi line blocks.
  } else if (str.match(this.regexs.multiStart)) {
    type = 'multistart';
  } else if (str.match(this.regexs.multiEnd)) {
    type = 'multiend';
  } else if ((this.regexs.single != null) && str.match(this.regexs.single)) {
    type = 'single';
  } else {
    type = 'code';
  }
  return type;
};

// Filter out comment symbols.
Language.prototype.filter = function(str) {
  var res = this.regexs;
  for (var key in res) {
    re = res[key];
    str = str.replace(re, '');
  }
  return str;
};

// Compile to CSS.
Language.prototype.compile = function(filename, customPreprocessor, cb) {
  var preCmd;
  if ((this.preprocessor != null) || customPreprocessor) {
    if (customPreprocessor != null) {
      preCmd = customPreprocessor + " " + filename;
    } else {
      preCmd = this.preprocessor.cmd + " " +
        (this.preprocessor.args.join(' ')) + " " + filename;
    }
    return exec(preCmd, function(err, stdout, stderr) {
      if (err != null) {
        return cb(new Error("There was an error processing " + filename + ".\n" + (err.message)));
      }
      return cb(null, stdout);
    });
  } else {
    return fs.readFile(filename, 'utf-8', function(err, data) {
      return cb(err, data);
    });
  }
};

// The supported stylesheet languages, their comment symbols and optional
// preprocessor command.
languages = {
  '.css':  new Language({ multi: ["/*", "*/"] }),
  '.scss': new Language({ single: '//', multi: ["/*", "*/"] },
                        { cmd: 'scss', args: ['-t', 'compressed'] }),
  '.sass': new Language({ single: '//', multi: ["/*", "*/"] },
                        { cmd: 'sass', args: ['-t', 'compressed'] }),
  '.less': new Language({ single: '//', multi: ["/*", "*/"] },
                        { cmd: 'lessc', args: ['-x'] }),
  '.styl': new Language({ single: '//', multi: ["/*", "*/"] },
                        { cmd: 'stylus', args: ['-c', '<'] })
};

// Public functions
// ----------------

// Determine whether a file is of a supported file type.
exports.isSupported = function(filename) {
  return path.extname(filename) in languages;
};

// Get the correspoding language object from a file name.
exports.getLanguage = function(filename) {
  return languages[path.extname(filename)];
};
