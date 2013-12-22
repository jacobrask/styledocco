var extract = require('../src/extract')
  , sdocco  = require('../src/styledocco')
  , expect  = require('chai').expect
  , path    = require('path')
  , helper  = require('./helpers')
  , fs      = require('fs')
  ;

// Allow non-mocha frameworks to skip over these tests.
if (!global.describe) { process.exit(); }

describe('styledocco', function() {
  // Function used for extracting the documentation
  // from CSS comments.

  var customArray = helper.array_with_links();

  var build_node = function(t, s) {
    var docs = helper.array_with_links();
    docs.push(helper.parse_tree[t](s));
    return docs;
  };

  var node_array = function() {
    return helper.array_with_links();
  }

  var paragraph_node = function(s) {
    return build_node("paragraph", s);
  }

  var code_node = function(s) {
    return build_node("code", s);
  }
  
  it('produces an empty token from an empty comment', function() {
    expect(sdocco('/* */')).to.eql([{
      code: '',
      docs: customArray
    }]);
  });

  it('produces an empty token from an empty multi-line comment', function() {
    expect(sdocco('/*\n*/')).to.eql([{
      code: '',
      docs: customArray
    }]);
  });

  it('interprets uncommented strings as css', function() {
    var code = '<strong>html</strong>';
    expect(sdocco(code)).to.eql([{
      code: code + '\n',
      docs: customArray
    }]);
  });

  it('interprets regular commented text as as paragraph', function() {
    var s = " I am a comment. ";
    expect(sdocco('/*{0}*/'.supplant([s]))).to.eql([{
      code: '',
      docs: paragraph_node(s)
    }]);
  });

  it('interprets multiple commented lines of text as a paragraph', function() {
    var s = " I am a comment.\nI am a new line.\n I am another line. ";
    expect(sdocco('/*{0}*/'.supplant([s]))).to.eql([{
      code: '',
      docs: paragraph_node(s)
    }]);
  });

  it('interprets html in comment as a paragraph', function() {
    var stub = {
      comment: ' <strong>example</strong> ',
      code: 'html {}'
    };
    expect(sdocco('/*{comment}*/\n{code}'.supplant(stub))).to.eql([{
      code: stub.code + '\n',
      docs: paragraph_node(stub.comment)
    }]);
  });

  it('interprets tab-indented text in comment as code', function() {
    var stub = {
      comment: 'example',
      code: 'html {}'
    };
    expect(sdocco('/*\t{comment}*/\n{code}'.supplant(stub))).to.eql([{
      code: stub.code + '\n',
      docs: code_node(stub.comment)
    }]);
  });

  it('interprets 4-space-indented html in comment as code', function() {
    var stub = {
      comment: 'example',
      code: 'html {}'
    };
    expect(sdocco('/*    {comment}*/\n{code}'.supplant(stub))).to.eql([{
      code: stub.code + '\n',
      docs: code_node(stub.comment)
    }]);
  });

  it('interprets more than 4-space-indented html in comment as code with the remaining spaces interpreted as part of the string', function() {
    var stub = {
      comment: ' example ',
      code: 'html {}'
    };
    expect(sdocco('/*    {comment}*/\n{code}'.supplant(stub))).to.eql([{
      code: stub.code + '\n',
      docs: code_node(stub.comment)
    }]);
  });

  it('identifies separate nodes with an empty line', function() {
    var stub = {
      comment: 'example',
      code: 'html {}'
    };
    var docs = node_array()
    docs.push(helper.parse_tree.paragraph(' ' + stub.comment));
    docs.push(helper.parse_tree.paragraph(stub.comment + ' '));
    expect(sdocco('/* {comment}\n\n{comment} */\n{code}'.supplant(stub))).to.eql([{
      code: stub.code + '\n',
      docs: docs
    }]);
  });
});
