(function() {

  exports.getDocs = function(lang, data) {
    var docs, formatDocs, line, lines;
    lines = data.split('\n');
    docs = '';
    formatDocs = function(line) {
      return "" + (lang.filter(line)) + "\n";
    };
    while (lines.length) {
      while (lines.length && (lang.checkType(lines[0]) === 'code' || lang.checkType(lines[0]) === 'multiend')) {
        docs += '\n';
        lines.shift();
      }
      while (lines.length && lang.checkType(lines[0]) === 'single') {
        docs += formatDocs(lines.shift());
      }
      if (lines.length && lang.checkType(lines[0]) === 'multistart') {
        while (lines.length) {
          line = lines.shift();
          docs += formatDocs(line);
          if (lang.checkType(line) === 'multiend') break;
        }
      }
    }
    return docs;
  };

}).call(this);
