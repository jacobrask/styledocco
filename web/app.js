// StyleDocco main application
// ===========================

'use strict';

var doc = document;
var project = window.styledocco.project;

// External dependencies
// =====================
var async = require('async');
var _ = require('underscore');
var Backbone = require('backbone');
var $ = Backbone.$ = require('jquery-browserify');


// Internal modules
// ================
var NavbarView = require('./views/Navbar');
var NavbarModel = require('./models/Navbar');

var Docu = require('./models/Documentation');
var DocuCollection = require('./models/DocumentationCollection');
var DocuView = require('./views/Documentation');


// Initialize models
// =================
var docus = new DocuCollection();
_.forEach(project.stylesheets, function (ss) {
  if (ss.name == null || (ss.path == null && ss.css == null)) return;
  var params = { name: ss.name };
  if (ss.path) {
    params.path = ss.path;
  } else {
    params.css = ss.css;
    params.docs = ss.docs;
    params.isLocal = true;
  }
  docus.add(new Docu(params));
});

if (project.includes) {
  _.forEach(project.includes, function (path) {
    var ext = path.match(/\.(css|js)$/i);
    if (ext == null) return;
    var type = ext[1].toLowerCase();
    type = type.charAt(0).toUpperCase() + type.slice(1);
    $.ajax(path).done(function (code) {
      docus.forEach(function (docu) {
        docu.set('include' + type, code);
      });
    });
  });
}

var navbar = new NavbarModel({ name: project.name });

var Router = Backbone.Router.extend({
  routes: {
    ':doc': 'docs'
  },
  docs: function (page) {
    var mod = docus.find(function (mod) { return mod.get('name') === page; });
    // TODO: Add error handling.
    if (mod == null) return;
    var docuView = new DocuView({ model: mod });
    var elem = doc.getElementById('content');
    elem.innerHTML = '';
    elem.appendChild(docuView.render().el);
  }
});


// Initialize views
// ================
// The only place where we interact with the pre-existing DOM.

$(doc).ready(function () {

  var router = new Router();
  // Disable `pushState` as there are no server routes
  Backbone.history.start({ pushState: false });

  var navbarView = new NavbarView({
    el: doc.getElementById('navbar'),
    collection: docus,
    model: navbar
  });

});
