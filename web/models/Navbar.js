'use strict';

var Model = require('backbone').Model;

var Navbar = Model.extend({
  defaults: {
    name: ''
  }
});

module.exports = Navbar;
