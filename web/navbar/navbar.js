'use strict';

var Backbone = require('backbone');
var $ = Backbone.$ = require('jquery-browserify');
var _ = require('underscore');

var doc = document;
var View = Backbone.View;
var Model = Backbone.Model;

var NavBar = Model.extend({
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


var MenuItemView = View.extend({
  tagName: 'li',
  
  events: { 'click': 'onClick' },

  render: function() {
    var mod = this.model;
    this.el.appendChild(
      this.make('a', { href: mod.get('name') }, mod.get('name'))
    );
    return this;
  },

  onClick: function(ev) {
    ev.preventDefault();
    this.model.activate();
  }

});

var NavBarView = View.extend({

  initialize: function() {
    _.bindAll(this);
    this.brand = new BrandView({ model: this.model });
    this.collection.bind("add", this.render);
    this.collection.bind("remove", this.render);
    this.render();
  },

  render: function() {
    this.el.innerHTML = '';
    this.el.appendChild(this.brand.render().el);
    this.el.appendChild(this.menuEl = doc.createElement('ul'));
    this.menuEl.className = 'menu';
    this.collection.forEach(function(item) {
      this.menuEl.appendChild(
        new MenuItemView({ model: item }).render().el
      );
    }, this);
    return this;
  }

});

module.exports = {
  Model: NavBar,
  View: NavBarView
};
