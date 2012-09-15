'use strict';

var async = require('async');
var _ = require('underscore');
var $ = require('jquery-browserify');
var NavBarView = require('./navbar/navbar').View;
var NavBarModel = require('./navbar/navbar').Model;
var Docu = require('./documentation/model');
var DocuView = require('./documentation/view');
var DocuCollection = require('./documentation/collection');

var doc = document;

// Initialize and fetch models before DOM ready
var docus = new DocuCollection();
_.forEach(styledocco.config.stylesheets, function(file) {
  docus.add(new Docu({ path: file }));
});

var navBar = new NavBarModel({ name: styledocco.config.name });

// Build views when DOM is ready
$(doc).ready(function() {
  var navBarView = new NavBarView({
    el: doc.getElementById('navbar'),
    collection: docus,
    model: navBar
  });
   
  var contentView = new DocuView({
    el: doc.getElementById('content'),
    collection: docus
  });
});
