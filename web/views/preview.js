'use strict';

var Backbone = require('backbone');
Backbone.$ = require('jquery-browserify');
var View = Backbone.View;

var _ = require('underscore');
var make = require('../../share/domsugar')(document);

var PreviewView = View.extend({

  initialize: function() {
    _.bindAll(this);
    this.render();
    this.updateCss();
    this.model.collection.on('change', this.updateCss);
  },

  events: {
    'input': 'updateHtml'
  },

  getIframeDoc: function(origCb) {
    var iframe = this.iframe;
    var cb = function(ev) { origCb(iframe.contentDocument, ev); };
    // Already in DOM
    if (document.getElementById(this.iframeId)) setTimeout(function() { cb('timeout'); }, 10);
    // Wait until inserted
    else iframe.addEventListener('load', function() { cb('load'); });
  },

  render: function() {
    var el = this.el;
    el.parentNode.insertBefore(
      make('.preview', [ make('.resizeable', [
        this.iframe = make('iframe', {
          src: 'javascript:0', scrolling: 'no', id: this.iframeId = _.uniqueId('iframe')
        })
      ]) ]),
      el
    );
    this.getIframeDoc(function(doc, ev) {
      doc.write(
        '<!DOCTYPE html><html><head><style></style><script></script></head><body>' +
        el.innerText
      );
    });
    return this;
  },
  updateHtml: function() {
    iframe.contentDocument.body.innerHTML = this.el.innerText;
  },
  updateCss: function() {
    this.getIframeDoc(_.bind(function(doc, ev) {
      doc.head.getElementsByTagName('style')[0]
        .textContent = this.model.collection.pluck('css').join('');
    }, this));
    return this;
  }
});


module.exports = PreviewView;
