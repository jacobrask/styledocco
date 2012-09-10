(function () {

'use strict';

if (typeof module == "object" && typeof require == "function") {
  var _ = require('underscore');
  var Backbone = require('backbone-browserify');
}

var doc = document;
var View = Backbone.View;
var Model = Backbone.Model;
var Collection = Backbone.Collection;

var NavBar = Backbone.Model.extend({
  defaults: {
    name: styledocco.config.name
  }
});

var BrandView = View.extend({
  tagName: 'a',
  className: 'brand',
  attributes: { href: './' },

  events: { 'click': 'clicked' },

  clicked: function(ev) {
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


if (typeof module == "object" && module.exports) {
  module.exports = {
    Model: NavBar,
    View: NavBarView
  };
} else {
  if (typeof window.styledocco == 'undefined') window.styledocco = {};
  window.styledocco.NavBar = NavBar;
  window.styledocco.NavBarView = NavBarView;
}

})();
