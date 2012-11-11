// StyleDocco main application JavaScript
// ======================================

'use strict';

var doc = document;

// External dependencies
// =====================
var async = require('async');
var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');


// Internal modules
// ================
var NavBarView = require('./views/navbar');
var NavBarModel = require('./models/navbar');

var Docu = require('./models/documentation');
var DocuCollection = require('./models/documentationcollection');
var DocuView = require('./views/documentation');


// Initialize models
// =================
// Do as much as possible before DOM ready to start sending out XHR's immediately.

// Wrapper around jQuery.ajax to make it compatible with async.
var ajax = function(path, cb) {
  $.ajax(path, {
    success: function(data, code, req) { cb(null, data, code, req); },
    error: function(req, err, ex) { cb(ex || new Error(err), req); }
  });
};

var docus = new DocuCollection();
_.forEach(styledocco.project.stylesheets, function(file) {
  docus.add(new Docu({ path: file }));
});

if (styledocco.project.includes) {
  async.map(styledocco.project.includes, ajax, function(err, res) {
    docus.forEach(function(docu) {
      docu.set('extraCss', res.join(''));
    });
  });
}

var navBar = new NavBarModel({ name: styledocco.project.name });

var Router = Backbone.Router.extend({
  routes: {
    ':doc': 'docs'
  },
  docs: function(page) {
    var mod = docus.find(function(mod) { return mod.get('name') === page; });
    // TODO: Add error handling.
    if (mod == null) return;
    var docuView = new DocuView({ model: mod });
    var el = doc.getElementById('content');
    el.innerHTML = '';
    el.appendChild(
      docuView.render().el
    );
  }
});


// Initialize views
// ================
// The only place where we interact with the pre-existing DOM.

$(doc).ready(function() {

  var router = new Router();
  // Disable `pushState` as there are no server routes
  Backbone.history.start({ pushState: false });

  var navBarView = new NavBarView({
    el: doc.getElementById('navbar'),
    collection: docus,
    model: navBar
  });

});
