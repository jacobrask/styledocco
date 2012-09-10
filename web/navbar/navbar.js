'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery-browserify');
Backbone.setDomLibrary($);

var doc = document;
var View = Backbone.View;
var Model = Backbone.Model;
var Collection = Backbone.Collection;

var NavBar = Backbone.Model.extend({
  defaults: {
    name: ''
  }
});

var BrandView = View.extend({
  tagName: 'a',
  className: 'brand',
  attributes: { href: './' },

  events: { 'click': 'onClick' },

  onClick: function(ev) {
    ev.preventDefault();
    console.log('Activate main view');
  },

  render: function() {
    this.el.innerText = this.model.get('name');
    return this;
  }
});


var NavBarView = Backbone.View.extend({

  initialize: function() {
    this.brand = new BrandView({ model: this.model });
    this.render();
    return this;
  },

  render: function() {
    this.el.appendChild(
      this.brand.render().el
    );
    return this;
  }
});

module.exports = {
  Model: NavBar,
  View: NavBarView
};
