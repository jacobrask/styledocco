'use strict'; /*global $:false,Prism:false*/

var _ = require('underscore');
/*var Prism = */require('../vendor/prism');
var Backbone = require('backbone');
Backbone.$ = require('jquery-browserify');
var View = Backbone.View;

var make = require('../../share/domsugar')(document);

var PreviewView = View.extend({

  initialize: function() {
    _.bindAll(this);
    this.$codeEl = this.$('code');
    this.render();
    this.model.collection.on('change', this.updateCss);
    this.on('iframeChange', this.updateHeight);
    this.updateCss();
    this.highlight();
  },

  events: {
    'input code': 'updateHtml',
    'blur code': 'highlight'
  },

  // Get the actual height of the iframe's content by getting the distance
  // between the element`s offsetParent and the bottom-most point of any child
  // elements. `offsetHeight` does not work with absolute or fixed positioned elements.
  getHeight: function(cb) {
    this.getIframeDoc(function(doc) {
      $(doc).ready(function() {
        var el = doc.body;
        if (el.childElementCount === 0) return el.offsetHeight;
        var win = el.ownerDocument.defaultView;
        var children = el.getElementsByTagName('*');
        for (var i = 0, l = children.length, childHeights = [], child; i < l; i++) {
          child = children[i];
          childHeights.push(child.offsetTop + child.offsetHeight +
            parseInt(win.getComputedStyle(child).getPropertyValue('margin-bottom'), 10)
          );
        }
        var extraHeight = parseInt(win.getComputedStyle(el).getPropertyValue('padding-bottom'), 10);
        var height = Math.max.apply(Math, childHeights) + extraHeight;
        cb(Math.max(height, el.offsetHeight));
      });
    });
  },

  getIframeDoc: function(origCb) {
    var iframe = this.iframe;
    var cb = function() {
      // Double check that we have a contentDocument
      if (iframe.contentDocument == null) setTimeout(cb, 500); // Retry
      else origCb(iframe.contentDocument);
    };
    // Already in DOM
    if (document.getElementById(this.iframeId)) setTimeout(cb, 10);
    // Wait until inserted
    else iframe.addEventListener('load', cb);
  },

  render: function() {
    var el = this.el;
    this.$codeEl.attr('title', "Click to edit");
    el.parentNode.insertBefore(
      make('.preview', [
        this.iframe = make('iframe', {
          src: 'javascript:999',
          scrolling: 'no',
          id: this.iframeId = _.uniqueId('iframe')
        })
      ]),
      el
    );
    this.getIframeDoc(function(doc, ev) {
      doc.write(
        '<!DOCTYPE html><html><head><style></style><script></script></head><body>' +
        el.innerText || ''
      );
      this.trigger('iframeChange');
    }.bind(this));
    return this;
  },

  updateHtml: function() {
    this.iframe.contentDocument.body.innerHTML = this.$codeEl.text();
    this.trigger('iframeChange');
  },
  updateCss: function() {
    var coll = this.model.collection;
    var css = coll.pluck('css').join('') + this.model.get('extraCss');
    this.getIframeDoc(_.bind(function(doc, ev) {
      doc.head.getElementsByTagName('style')[0].textContent = css;
      this.trigger('iframeChange');
    }, this));
    return this;
  },
  updateHeight: function() {
    this.getHeight(_.bind(function(height) {
      this.iframe.parentNode.style.height = (height + 20) + 'px';
    }, this));
  },


  highlight: function() {
    this.$codeEl.html(
      Prism.highlight(this.getText(), Prism.languages.markup)
    );
  },

  getText: function() {
    var $el = this.$codeEl;
    if ($.browser.webkit)
      $el.find('div').replaceWith(function() { return "\n" + this.innerHTML; });
    if ($.browser.msie)
      $el.find('p').replaceWith(function() { return this.innerHTML + "<br>"; });
    if ($.browser.mozilla || $.browser.opera || $.browser.msie)
      $el.find('br').replaceWith("\n");
    return $el.text().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});


module.exports = PreviewView;
