// Dependencies and configuration.
var fs = require('fs');
var highlight = require('highlight.js');
var marked = require('marked');
var _ = require('./utils');
marked.setOptions({ sanitize: false, gfm: true });


// Public functions.

// Extract comments and code in matching blocks. Each continous block of
// comments is matched with the code that follows it, until the next comment
// block starts.
var extractBlocks = exports.extractBlocks = function(lang, data) {
  var lines = data.split('\n');
  var sections = [];
  var formatCode = function(line) {
    return (line.replace(/(;base64,)[^\)]*/, '$1...')) + "\n";
  };
  formatDocs = function(line) {
    return (lang.filter(line)) + "\n";
  };
  while (lines.length) {
    docs = code = '';
    // First check for any single line comments.
    while (lines.length && lang.checkType(lines[0]) === 'single') {
      docs += formatDocs(lines.shift());
    }
    // A multi line comment starts here, add lines until comment ends.
    if (lines.length && lang.checkType(lines[0]) === 'multistart') {
      while (lines.length) {
        line = lines.shift();
        docs += formatDocs(line);
        if (lang.checkType(line) === 'multiend') {
          break;
        }
      }
    }
    while (lines.length && (lang.checkType(lines[0]) === 'code' || lang.checkType(lines[0]) === 'multiend')) {
      code += formatCode(lines.shift());
    }
    sections.push({ docs: docs, code: code });
  }
  return sections;
};

var makeSections = exports.makeSections = function(blocks) {
  return blocks.map(function(block) {
    // Run comments through marked.lexer to get Markdown tokens, and run
    // code through highlight.js.
      return {
        docs: marked.lexer(block.docs),
        code: styleHighlighter(block.code)
      };
    }
    ).map(addDocExamples, []
    ).reduce(splitter, []
    ).map(parser);
};

// Internal functions.

// If we encounter code blocks in documentation, add example HTML and
// highlight the code snippet.
var addDocExamples = function(block) {
  var newBlock = {
    code: block.code,
    docs: block.docs.reduce(function(tokens, token) {
      if (token.type === 'code') {
        tokens.push({
          type: 'html',
          pre: true,
          text: "<div class=\"styledocco-example\">" + token.text + "</div>"
        });
        token.text = highlight.highlightAuto(token.text).value;
        token.escaped = true;
      }
      tokens.push(token);
      return tokens;
    }, [])
  };
  // Copy marked's custom links property on the docs array
  newBlock.docs.links = block.docs.links;
  return newBlock;
};

// Split into sections with headers as delimiters.
var splitter = function(sections, cur) {
  var docs = cur.docs;
  for (var i = 0, len = docs.length; i < len; i++) {
    doc = docs[i];
    if (sections.length === 0 || (doc.type === 'heading' && doc.depth <= 2)) {
      sections.push({
        docs: [doc],
        code: ''
      });
    } else {
      sections[sections.length - 1].docs.push(doc);
    }
  }
  // Add code to last section.
  if (sections.length === 0) {
    sections.push(cur);
  } else {
    sections[sections.length - 1].code += cur.code;
  }
  return sections;
};

// Run through marked parser to generate HTML.
var parser = function(block) {
  return {
    docs: _.trimNewLines(marked.parser(block.docs)),
    code: _.trimNewLines(block.code)
  };
};

// Highlight CSS code.
var styleHighlighter = function(code) {
  return highlight.highlight('css', code).value;
};
