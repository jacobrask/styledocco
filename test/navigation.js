'use strict';

var Collection = require('backbone').Collection;
var NavBarView = require('../../web/views/navbar');
var NavBarModel = require('../../web/models/navbar');

var doc = document;

buster.testCase("Navigation", {
  "Set name": function() {
    var name = 'Site name';
    var navBarView = new NavBarView({
      el: doc.createElement('div'),
      model: new NavBarModel({ name: name }),
      collection: new Collection()
    });
    assert.tagName(navBarView.el, 'div');
    assert.match(navBarView.brand.el, {
      tagName: 'a',
      className: 'brand',
      innerText: name
    });
  }
});
