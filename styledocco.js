'use strict';

var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });

// Regular expressions to match comments. We only match comments in
// the beginning of lines. 
var commentRegexs = {
  single: /^\/\//, // Single line comments for Sass, Less and Stylus
  multiStartIgnore: /^\/\*+\!/, // Multi line ignore documentation
  multiStart: /^\/\*/,
  multiEnd: /\*\//
};

// Hashing identification from national header
var hashCode = function(str) {
  var hash = 0, i, chr, len;
  if (str.length == 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Make an URL slug from `str`.
var slugify = function(str) {
  var slug = encodeURIComponent(
    str.trim().toLowerCase()
      .replace(/[^\w ]+/g,'')
      .replace(/ +/g,'-')
  );
  return slug.length <= 1 ? hashCode(str) : slug;
};

// Check if a string is code or a comment (and which type of comment).
var checkType = function(str) {
  // Checking ignoring multi line comments
  if (str.match(commentRegexs.multiStartIgnore) && str.match(commentRegexs.multiEnd)) {
    return 'ignore';
  // Treat multi start and end on same row as a single line comment.
  } else if (str.match(commentRegexs.multiStart) && str.match(commentRegexs.multiEnd)) {
    return 'single';
  // Checking for ignoring multi line comments first to avoid matching single line
  } else if (str.match(commentRegexs.multiStartIgnore)) {
    return 'multistartignore';
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
  // Truncate base64 encoded strings
  return str.replace(/(;base64,)[^\)]*/, '$1...') + '\n';
};

// Trim newlines from beginning and end of a multi line string.
var trimNewLines = function(str) {
  return str.replace(/^\n*/, '').replace(/\n*$/, '');
};

var htmlEntities = function(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var separate = function(css) {
  var lines = css.split('\n');
  var docs, code, line, blocks = [];
  while (lines.length) {
    docs = code = '';
    // A multi line ignoring comment starts here, add lines until comment ends.
    if (lines.length && checkType(lines[0]) === 'multistartignore') {
      while (lines.length) {
        line = lines.shift();
        if (checkType(line) === 'multiend') break;
      }
    }
    // First check for any single line ignore comments.
    while (lines.length && checkType(lines[0]) === 'ignore') {
      line = lines.shift();
    }
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
    
    // Remove empty line start in document
    if(trimNewLines(docs).length) {
      blocks.push({ docs: docs, code: code });
    }
  }
  return blocks;
};


var makeSections = exports.makeSections = function(blocks) {
  return blocks
    .map(function(block) {
      // Run comments through marked.lexer to get Markdown tokens.
      block.docs = marked.lexer(block.docs);
      return block;
    })
    .map(function(block) {
      // If we encounter code blocks in documentation, add preview HTML.
      var newBlock = {
        code: block.code,
        docs: block.docs.reduce(function(tokens, token) {
          if (token.type === 'code' && (token.lang == null || token.lang === 'html')) {
            token.type = 'html';
            token.pre = true;
            token.text = '<textarea class="preview-code" spellcheck="false">' + htmlEntities(token.text) + '</textarea>';
          // Add permalink `id`s and some custom properties to headings.
          } else if (token.type === 'heading') {
            var slug = slugify(token.text);
            token.type = 'html';
            token._slug = slug;
            token._origText = token.text;
            // This token should start a new doc section
            if (token.depth === 1) token._split = true;
            token.text = '<h' + token.depth + ' id="' + slug + '">' +
                         token.text + '</h' + token.depth + '>\n';
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
      // Split into sections with headings as delimiters.
      var docs = cur.docs;
      while (docs.length) {
        // New or first section, add title/slug properties.
        if (docs[0]._split || sections.length === 0) {
          var title = docs[0]._origText;
          var slug = docs[0]._slug;
          sections.push({ docs: [ docs.shift() ], code: '',
                          title: title, slug: slug });
        } else {
          // Add the documentation to the last section.
          sections[sections.length-1].docs.push(docs.shift());
        }
        // Keep marked's custom links property on the docs arrays.
        sections[sections.length-1].docs.links = docs.links;
      }
      // No docs in file, just add the CSS.
      if (sections.length === 0) {
        sections.push(cur);
      // Add remaining code to the last section.
      } else {
        sections[sections.length-1].code += cur.code;
      }
      return sections;
    }, [])
    .map(function(section) {
      // Run through marked parser to generate HTML.
      return {
        title: section.title ? section.title.trim() : '',
        slug: section.slug || '',
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
