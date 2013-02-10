// StyleDocco documentation model
// ==============================

'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
Backbone.$ = require('jquery');
var Model = Backbone.Model;
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });
var styledocco = require('../../styledocco');
var path = require('path');


var Documentation = Model.extend({

  defaults: {
    name: '',
    css: '',
    includeCss: '',
    includeJs: '',
    path: '',
    docs: 'Loading stylesheet documentation&hellip;',
    isLocal: false
  },

  initialize: function () {
    _.bindAll(this);
    if (!this.isLocal) this.fetch();
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

  error: function (req, err, ex) {
    this.set('docs', "Could not fetch documentation from " + this.get('path'));
  },

  // Prefix @imports and urls in files with the same prefix as the input CSS
  normalizePaths: function (str) {
    var pre = path.dirname(this.get('path'));
    if (pre) pre = pre + '/';
    return str.replace(
      /(url\(|@import\s["'])([^'"]*)/,
      function (str, p1, p2) { return p1 + pre + p2; }
    );
  },

  parse: function (res) {
    return {
      css: this.normalizePaths(res),
      docs: styledocco(res)
    };
  }

});

module.exports = Documentation;
