// StyleDocco preview rendering
// ============================

(function () {

'use strict';

// Browserify
var _, domsugar;
if (typeof module == "object" && typeof require == "function") {
  _ = require('./iterhate');
  domsugar = require('./domsugar');
} else {
  _ = window.iterhate;
  domsugar = window.domsugar;
}

var doc = document;
var el = domsugar(doc);


// Clone pseudo class selectors in a stylesheet with regular class selectors.
// For example, `a:hover` becomes `a.:hover`.
//
// [StyleSheetList] -> [String]
var clonePseudoClasses = (function() {
  // Compile regular expression.
  var pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
    'enabled', 'disabled', 'checked' ];
  var pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi");
  return function(styleSheets) {
    return _(styleSheets)
      .pluck('cssRules')
      .map(function(rule) {
        return _(rule)
          .pluck('cssText')
           // Keep only rules with pseudo classes
          .filter(function(item) { return item.match(pseudoRe); })
          // Replace : with . and encoded :
          .invoke('replace', pseudoRe, ".\\3A $1")
          .join('');
      })
      .join('');
  };
})();


// Get the actual height of an element's content by getting the distance
// between the element`s offsetParent and the bottom-most point of any child
// elements. `offsetHeight` does not work with absolute or fixed positioned elements.
var getContentHeight = function(elem) {
  if (elem.childElementCount === 0) return elem.offsetHeight;
  var win = elem.ownerDocument.defaultView;
  var children = elem.getElementsByTagName('*');
  for (var i = 0, l = children.length, childHeights = [], child; i < l; i++) {
    child = children[i];
    childHeights.push(child.offsetTop + child.offsetHeight +
      parseInt(win.getComputedStyle(child).getPropertyValue('margin-bottom'), 10)
    );
  }
  var extraHeight = parseInt(win.getComputedStyle(elem).getPropertyValue('padding-bottom'), 10);
  var height = Math.max.apply(Math, childHeights) + extraHeight;
  return Math.max(height, elem.offsetHeight);
};


// Create and insert an iframe
var renderPreview = (function() {
  // Get preview styles and scripts intended for preview iframes.
  var styles = _(doc.head.querySelectorAll('style[type="text/preview"]'))
    .pluck('innerHTML').join('');
  var scripts = _(doc.head.querySelectorAll('script[type="text/preview"]'))
    .pluck('innerHTML').join('');
  var iFrameHtml = '<!DOCTYPE html><html><head>' +
    '<style>' + styles + '</style>' +
    '<script>' + scripts + '<\/script></head><body>';

  return function(codeEl) {
    var iFrameEl = el('iframe', { src: 'javascript:0', scrolling: 'no' });
    codeEl.parentNode.insertBefore(
      el('.preview', [ el('.resizeable', [ iFrameEl ]) ]),
      codeEl
    );
    var iFrameDoc = iFrameEl.contentDocument;
    iFrameDoc.write(iFrameHtml + codeEl.value);
    iFrameDoc.head.insertBefore(
      el('style', { text: clonePseudoClasses(iFrameDoc.styleSheets) }),
      iFrameDoc.head.getElementsByTagName('style')[0]
    );
    iFrameEl.updateHeight = function() {
      this.style.height = getContentHeight(iFrameDoc.body) + 'px';
    };
    codeEl.addEventListener('input', function() {
      iFrameDoc.body.innerHTML = this.value;
      iFrameEl.updateHeight();
    });
    iFrameEl.updateHeight();
  };
})();

_(doc.querySelectorAll('textarea.preview-code')).forEach(function(codeEl) {
  renderPreview(codeEl);
});

renderPreview.clonePseudoClasses = clonePseudoClasses;
renderPreview.getContentHeight = getContentHeight;

if (typeof module != 'undefined' && module.exports) {
  module.exports = renderPreview;
} else {
  window.styledocco = window.styledocco || {};
  window.styledocco.renderPreview = renderPreview;
}

})();
