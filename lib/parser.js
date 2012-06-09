// Exported function
var parser = function(css) {
  return separate(css);
}

// Regular expressions to match comments. We only match comments in
// the beginning of lines. 
var commentRegexs = {
  single: /^\/\//, // Single line comments for SASS, Less and Stylus
  multiStart: /^\/\*/,
  multiEnd: /\*\//
};

// Check if a string is code or a comment (and which type of comment).
var checkType = function(str) {
  var type;
  // Treat multi start and end on same row as a single line comment.
  if (str.match(commentRegexs.multiStart) && str.match(commentRegexs.multiEnd)) {
    type = 'single';
  // Checking for multi line comments first to avoid matching single line
  // comment symbols inside multi line blocks.
  } else if (str.match(commentRegexs.multiStart)) {
    type = 'multistart';
  } else if (str.match(commentRegexs.multiEnd)) {
    type = 'multiend';
  } else if ((commentRegexs.single != null) && str.match(commentRegexs.single)) {
    type = 'single';
  } else {
    type = 'code';
  }
  return type;
};

var formatDocs = function(str) {
  // Filter out comment symbols
  for (var key in commentRegexs) {
    str = str.replace(commentRegexs[key], '');
  }
  return str + '\n';
};

var formatCode = function(str) {
  return str + '\n';
};


var separate = parser.separate = function(css) {
  var lines = css.split('\n');
  var docs, code, sections = [];
  while (lines.length) {
    docs = code = '';
    // First check for any single line comments.
    while (lines.length && checkType(lines[0]) === 'single') {
      docs += formatDocs(lines.shift());
    }
    // A multi line comment starts here, add lines until comment ends.
    if (lines.length && checkType(lines[0]) === 'multistart') {
      while (lines.length) {
        line = lines.shift();
        docs += formatDocs(line);
        if (checkType(line) === 'multiend') break;
      }
    }
    while (lines.length && (checkType(lines[0]) === 'code' || checkType(lines[0]) === 'multiend')) {
      code += formatCode(lines.shift());
    }
    sections.push({ docs: docs, code: code });
  }
  return sections;
};

module.exports = parser;
