'use strict';

var styledocco = require('../../styledocco');
var Backbone = require('backbone');
var _ = require('underscore');
var path = require('path');
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });

var createCodePreview = _.template(
  '<div class="preview"><div class="resizeable">' +
  '<iframe src="javascript:0" scrolling="no"></iframe></div></div>' +
  '<pre class="preview-code" contenteditable><code><%- code %></code></pre>'
);

var Documentation = Backbone.Model.extend({

  defaults: {
    css: '',
    name: ''
  },

  initialize: function() {
    this.fetch({ dataType: 'text' });
    this.set('name', this.baseFileName());
  },

  activate: function() {
    this.collection.trigger('activate');
  },

  url: function() {
    return this.get('path');
  },

  parse: function(res) {
    return { css: res };
  },

  tokenize: function() {
    var tokens = marked.lexer(styledocco(this.get('css')));
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

  // Get a filename without the extension
  baseFileName: function() {
    var name = this.get('path');
    return path.basename(name, path.extname(name)).replace(/^_/, '');
  }

});

module.exports = Documentation;
