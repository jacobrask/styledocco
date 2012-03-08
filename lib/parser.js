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

  exports.makeSections = function(tokens) {
    var section, sections;
    sections = [];
    while (tokens.length) {
      if ((tokens[0].type === 'heading' && tokens[0].depth <= 2) || tokens[0].type === 'hr') {
        if (tokens[0].type === 'hr') tokens.shift();
        if ((typeof section !== "undefined" && section !== null ? section.length : void 0) || !tokens.length) {
          sections.push(section);
        }
        if (tokens.length) section = [tokens.shift()];
      } else {
        (section != null ? section : section = []).push(tokens.shift());
        if (!tokens.length) sections.push(section);
      }
    }
    return sections;
  };

  exports.getTitle = function(tokens) {
    var _ref, _ref2, _ref3;
    if (((_ref = tokens[0]) != null ? _ref.type : void 0) === 'heading' && ((_ref2 = tokens[0]) != null ? _ref2.depth : void 0) === 1) {
      return (_ref3 = tokens[0]) != null ? _ref3.text : void 0;
    }
  };

  exports.getDescription = function(tokens) {
    var _ref, _ref2;
    if (((_ref = tokens[0]) != null ? _ref.type : void 0) === 'paragraph') {
      return (_ref2 = tokens[0]) != null ? _ref2.text : void 0;
    }
  };

}).call(this);
