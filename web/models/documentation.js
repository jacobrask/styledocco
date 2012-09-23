// StyleDocco documentation model
// ==============================
// Handles CSS -> comments -> tokens -> HTML conversions.

'use strict';

var Backbone = require('backbone');
var $ = Backbone.$ = require('jquery-browserify');
var Model = Backbone.Model;

var _ = require('underscore');
var path = require('path');
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });

var styledocco = require('../../styledocco');

var Documentation = Model.extend({

  defaults: {
    name: '',
    css: '',
    path: '',
    docs: 'Loading stylesheet documentation&hellip;'
  },

  initialize: function() {
    _.bindAll(this);
    this.fetch();
    this.set('name', this.baseFileName(this.get('path')));
  },
  
  fetch: function() {
    Model.prototype.fetch.call(this, {
      dataType: 'text',
      error: this.error
    });
  },

  error: function() {
    this.set('docs', "Could not fetch documentation from " + this.get('path'));
  },

  url: function() {
    return this.get('path');
  },

  parse: function(res) {
    return {
      css: res,
      docs: marked.parser(this.tokenize(res))
    };
  },

  // Return Markdown tokens from CSS comments
  tokenize: function(css) {
    var tokens = marked.lexer(styledocco(css));
    return _.map(tokens, function(token) {
      // Replace HTML code blocks with textareas
      if (token.type === 'code' && (token.lang == null || token.lang === 'html')) {
        token.type = 'html';
        token.pre = true;
        token.text = _.template('<pre class="preview-code" contenteditable>' +
          '<code><%- code %></code></pre>')({ code: token.text });
      }
      return token;
    });
  },

  // Get a filename without the extension and leading _
  baseFileName: function(name) {
    return path.basename(name, path.extname(name)).replace(/^_/, '');
  }

});


module.exports = Documentation;
