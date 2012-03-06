(function() {

  module.exports = function(lang, data) {
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
        docs: docs,
        code: code
      });
    }
    return sections.reverse();
  };

}).call(this);
