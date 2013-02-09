'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
Backbone.$ = require('jquery-browserify');
var View = Backbone.View;

var PreviewView = require('./preview');


var DocumentationView = View.extend({

  tagName: 'article',

  initialize: function() {
    _.bindAll(this);
    this.model.on('change', this.render);
  },

  render: function() {
    this.el.innerHTML = this.model.get('docs');
    this.addPreviews();
    return this;
  },

  addPreviews: function() {
    var codeEls = this.el.getElementsByClassName('preview-code');
    if (!codeEls.length) return;
    _.forEach(codeEls, function(el) {
      new PreviewView({
        el: el,
        model: this.model
      });
    }, this);
  }
});


module.exports = DocumentationView;
