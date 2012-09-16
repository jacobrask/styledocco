'use strict';

var Backbone = require('backbone');
Backbone.$ = require('jquery-browserify');
var View = Backbone.View;

var _ = require('underscore');


var DocumentationView = View.extend({

  tagName: 'article',

  initialize: function() {
    _.bindAll(this);
    this.model.on('ready', this.render);
  },

  render: function() {
    this.el.innerHTML = this.model.get('docs');
    return this;
  }

});


module.exports = DocumentationView;
