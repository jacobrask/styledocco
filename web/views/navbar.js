'use strict';

var Backbone = require('backbone');
Backbone.$ = require('jquery-browserify');
var View = Backbone.View;
var _ = require('underscore');


var BrandView = View.extend({

  tagName: 'a',
  className: 'brand',

  attributes: { href: './' },

  render: function() {
    this.el.innerText = this.model.get('name');
    return this;
  }
});


var MenuItemView = View.extend({

  tagName: 'li',
  
  render: function() {
    var mod = this.model;
    this.el.appendChild(
      this.make('a', { href: '#doc/' + mod.get('name') }, mod.get('name'))
    );
    return this;
  }

});


var NavBarView = View.extend({

  initialize: function() {
    _.bindAll(this);
    this.brand = new BrandView({ model: this.model });
    this.collection.bind('change', this.render);
    this.render();
  },

  render: function() {
    this.el.innerHTML = '';
    this.el.appendChild(this.brand.render().el);
    this.el.appendChild(this.menuEl = this.make('ul', { 'class': 'menu' }));
    this.collection.forEach(function(item) {
      this.menuEl.appendChild(
        new MenuItemView({ model: item }).render().el
      );
    }, this);
    return this;
  }

});

module.exports = NavBarView;
