'use strict';

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

var formatCode = function(str) {
  return str + '\n';
};

// Trim newlines from beginning and end of multi line string.
var trimNewLines = function(str) {
  return str.replace(/^\n*/, '').replace(/\n*$/, '');
};


var separate = function(css) {
  var lines = css.split('\n');
  var docs, code, line, blocks = [];
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
    blocks.push({ docs: docs, code: code });
  }
  return blocks;
};

var makeSections = exports.makeSections = function(blocks) {
  return blocks
    .map(function(block) {
      // Run comments through marked.lexer to get Markdown tokens
      return {
        docs: marked.lexer(block.docs),
        code: block.code
      };
    })
    .map(function(block) {
      // If we encounter code blocks in documentation, add example HTML
      var newBlock = {
        code: block.code,
        docs: block.docs.reduce(function(tokens, token) {
          if (token.type === 'code') {
            tokens.push({
              type: 'html',
              pre: true,
              text: "<div class=\"styledocco-example\">" + token.text + "</div>"
            });
          }
          tokens.push(token);
          return tokens;
        }, [])
      };
      // Keep marked's custom links property on the docs array.
      newBlock.docs.links = block.docs.links;
      return newBlock;
    }, [])
    .reduce(function(sections, cur) {
      // Split into sections with headers as delimiters.
      var doc;
      var docs = cur.docs;
      for (var i = 0, len = docs.length; i < len; i++) {
        doc = docs[i];
        if (sections.length === 0 || (doc.type === 'heading' && doc.depth <= 2)) {
          sections.push({ docs: [ doc ], code: '' });
        } else {
          sections[sections.length-1].docs.push(doc);
        }
        // Keep marked's custom links property on the docs arrays.
        sections[sections.length-1].docs.links = docs.links;
      }
      // Add code to last section.
      if (sections.length === 0) {
        sections.push(cur);
      } else {
        sections[sections.length-1].code += cur.code;
      }
      return sections;
    }, [])
    .map(function(section) {
      // Run through marked parser to generate HTML.
      return {
        docs: trimNewLines(marked.parser(section.docs)),
        code: trimNewLines(section.code)
      };
    });
};

module.exports = function(css) {
  return makeSections(separate(css));
};
module.exports.makeSections = makeSections;
module.exports.separate = separate;
