// StyleDocco main application JavaScript
// ======================================
// The only place where we interact with the pre-existing DOM.

'use strict';

var doc = document;

// External dependencies
// =====================
var Backbone = require('backbone');
var _ = require('underscore');


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

var docus = new DocuCollection();
_.forEach(styledocco.config.stylesheets, function(file) {
  docus.add(new Docu({ path: file }));
});

var navBar = new NavBarModel({ name: styledocco.config.name });

var Router = Backbone.Router.extend({
  routes: {
    'doc/:doc': 'docs'
  },
  docs: function(page) {
    var mod = docus.find(function(mod) { return mod.get('name') === page; });
    if (mod == null) return;
    var docu = new DocuView({ model: mod });
    var el = doc.getElementById('content');
    el.innerHTML = '';
    el.appendChild(
      docu.render().el
    );
  }
});


// Initialize views
// ================
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
