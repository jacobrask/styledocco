'use strict';

var navbar = require('../../web/navbar/navbar');
var NavBarView = navbar.View;
var NavBarModel = navbar.Model;

var doc = document;

buster.testCase("Navigation", {
  "Set name": function() {
    var name = 'Site name';
    var navBarView = new NavBarView({
      el: doc.createElement('div'),
      model: new NavBarModel({ name: name })
    });
    assert.tagName(navBarView.el, 'div');
    assert.match(navBarView.brand.el, {
      tagName: 'a',
      className: 'brand',
      innerText: name
    });
  }
});
