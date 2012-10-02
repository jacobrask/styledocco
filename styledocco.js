'use strict';

var _ = require('underscore');
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });


// Regular expressions to match comments. We only match comments in
// the beginning of lines. 
var commentRegexs = {
  single: /^\/\//, // Single line comments for Sass, Less and Stylus
  multiStart: /^\/\*/,
  multiEnd: /\*\//
};

// Check if a string is code or a comment (and which type of comment).
var checkType = function(str) {
  // Treat multi start and end on same row as a single line comment.
  if (str.match(commentRegexs.multiStart) && str.match(commentRegexs.multiEnd)) {
    return 'single';
  // Checking for multi line comments first to avoid matching single line
  // comment symbols inside multi line blocks.
  } else if (str.match(commentRegexs.multiStart)) {
    return 'multistart';
  } else if (str.match(commentRegexs.multiEnd)) {
    return 'multiend';
  } else if ((commentRegexs.single != null) && str.match(commentRegexs.single)) {
    return 'single';
  } else {
    return 'code';
  }
};

var formatDocs = function(str) {
  // Filter out comment symbols
  for (var key in commentRegexs) {
    str = str.replace(commentRegexs[key], '');
  }
  return str + '\n';
};

var getComments = function(css) {
  if (typeof css != 'string') return '';
  var lines = css.split('\n');
  var docs = '';
  while (lines.length) {
    // First check for any single line comments.
    while (lines.length && checkType(lines[0]) === 'single') {
      docs += formatDocs(lines.shift());
    }
    // A multi line comment starts here, add lines until comment ends.
    if (lines.length && checkType(lines[0]) === 'multistart') {
      do {
        docs += formatDocs(lines.shift());
      } while (lines.length && checkType(lines[0]) !== 'multiend')
    }
    // Ignore the code
    while (lines.length && (checkType(lines[0]) === 'code' || checkType(lines[0]) === 'multiend')) {
      lines.shift();
    }
    docs += '\n';
  }
  return docs;
};

var previewTemplate = _.template(
  '<pre class="preview-code" contenteditable spellcheck="false">' +
  '<code class="language-html"><%- code %></code></pre>'
);

var tokenize = exports.tokenize = function(docs) {
  var tokens = marked.lexer(docs);
  _.forEach(tokens, function(token) {
    // Replace HTML code blocks with editable `pre`'s
    if (token.type === 'code' && (token.lang == null || token.lang === 'html')) {
      token.type = 'html';
      token.pre = true;
      token.text = previewTemplate({ code: token.text });
    }
  });
  return tokens;
};

module.exports = function(css) {
  return marked.parser(
    tokenize(
      getComments(css)
    )
  );
};
