'use strict';

var Backbone = require('backbone');
var $ = Backbone.$ = require('jquery-browserify');
var _ = require('underscore');
var marked = require('marked');
marked.setOptions({ sanitize: false, gfm: true });

var doc = document;
var View = Backbone.View;

var DocumentationView = View.extend({
  tagName: 'article',

  render: function() {
    this.el.innerHTML = marked.parser(this.model.tokenize());
    return this;
  }
});


var DocumentationCollectionView = View.extend({

  initialize: function() {
    _.bindAll(this);
    this.collection.bind("add", this.render);
    this.collection.bind("remove", this.render);
    this.collection.bind("activate", this.render);
    this.render();
  },

  activate: function() { this.render(); },

  render: function() {
    this.el.innerHTML = '';
    this.collection.forEach(function(item) {
      this.el.appendChild(
        new DocumentationView({ model: item }).render().el
      );
    }, this);
    return this;
  }

});

module.exports = DocumentationCollectionView;
