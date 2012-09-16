'use strict';

var Model = require('backbone').Model;

var NavBar = Model.extend({
  defaults: {
    name: ''
  }
});

module.exports = NavBar;
