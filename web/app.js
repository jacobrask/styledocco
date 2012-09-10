(function () {

'use strict';

if (typeof module == "object" && typeof require == "function") {
  var $ = require('jquery-browserify');
  var _ = require('underscore');
  var navbar = require('./navbar/navbar');
  var NavBarView = navbar.View;
  var NavBarModel = navbar.Model;
}

var doc = document;

$(doc).ready(function() {

var navBarView = new NavBarView({
  el: doc.getElementById('navbar'),
  model: new NavBarModel()
});

});

})();
