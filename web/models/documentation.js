// StyleDocco documentation model
// ==============================

'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
Backbone.$ = require('jquery');
var Model = Backbone.Model;
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });
var path = require('path');
var styledocco = require('../../styledocco');


var Documentation = Model.extend({

  defaults: {
    name: '',
    css: '',
    extraCss: '',
    path: '',
    docs: 'Loading stylesheet documentation&hellip;'
  },

  initialize: function() {
    _.bindAll(this);
    this.fetch();
    this.set('name', this.baseFileName(this.get('path')));
  },


  // Fetching and parsing
  // --------------------

  url: function() {
    return this.get('path');
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

  parse: function(res) {
    return {
      css: res,
      docs: styledocco(res)
    };
  },

  // Get a filename without the extension and leading _
  baseFileName: function(name) {
    return path.basename(name, path.extname(name)).replace(/^_/, '');
  }

});

module.exports = Documentation;
