// StyleDocco documentation model
// ==============================
// Handles CSS -> comments -> tokens -> HTML conversions.

'use strict';

var Model = require('backbone').Model;

var _ = require('underscore');
var path = require('path');
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });

var styledocco = require('../../styledocco');

var createCodePreview = _.template(
  '<div class="preview"><div class="resizeable">' +
  '<iframe src="javascript:0" scrolling="no"></iframe></div></div>' +
  '<pre class="preview-code" contenteditable><code><%- code %></code></pre>'
);


var Documentation = Model.extend({

  defaults: {
    name: '',
    docs: 'Loading documentation&hellip;',
    path: ''
  },

  initialize: function() {
    _.bindAll(this);
    this.fetch({
      dataType: 'text',
      success: this.success,
      error: this.error
    });
    this.set('name', this.baseFileName());
  },

  success: function() {
    this.trigger('ready');
  },
  error: function() {
    this.set('docs', "Could not fetch documentation from " + this.get('path'));
    this.trigger('ready');
  },

  url: function() {
    return this.get('path');
  },

  parse: function(res) {
    return { docs: marked.parser(this.tokenize(res)) };
  },

  // Return Markdown tokens from CSS comments
  tokenize: function(css) {
    var tokens = marked.lexer(styledocco(css));
    return _.map(tokens, function(token) {
      // Replace HTML code blocks with textareas
      if (token.type === 'code' && (token.lang == null || token.lang === 'html')) {
        token.type = 'html';
        token.pre = true;
        token.text = createCodePreview({ code: token.text });
      }
      return token;
    });
  },

  // Get a filename without the extension and leading _
  baseFileName: function() {
    var name = this.get('path');
    return path.basename(name, path.extname(name)).replace(/^_/, '');
  }

});


module.exports = Documentation;
