(function () {

'use strict';

// Browserify
var _, domsugar, renderPreview;
if (typeof module == "object" && typeof require == "function") {
  _ = require('./iterhate');
  domsugar = require('./domsugar');
  renderPreview = require('./previews');
} else {
  _ = window._;
  domsugar = window.domsugar;
  renderPreview = window.styledocco.renderPreview;
}

var doc = document;
var el = domsugar(doc);

// Get the style property of element. Convert numerical values to integers
// and falsy values to null.
var getStyle = function(el, prop) {
  var val = el.ownerDocument.defaultView.getComputedStyle(el).getPropertyValue(prop);
  val = ([ 'none', '' ].indexOf(val) !== -1) ? null : val;
  var integer = parseInt(val, 10);
  return isNaN(integer) ? val : integer;
};

var autoResizeTextArea = function(origEl) {
  var mirrorEl = el('div', { className: origEl.className });
  mirrorEl.style.position = 'absolute';
  mirrorEl.style.left = '-9999px';
  origEl.parentNode.appendChild(mirrorEl);
  var borderHeight = getStyle(origEl, 'border-top') +
                     getStyle(origEl, 'border-bottom');
  var maxHeight = getStyle(origEl, 'max-height');

  origEl.addEventListener('codechange', function() {
    mirrorEl.textContent = origEl.value + '\n';
    var height = mirrorEl.offsetHeight;
    origEl.style.height = (height - borderHeight) + 'px';
    origEl.style.overflowY = (maxHeight && height >= maxHeight) ? 'auto' : 'hidden';
  });
  return mirrorEl;
};


_(doc.getElementsByClassName('preview-code')).forEach(function(codeEl) {

  renderPreview(codeEl, function(err, iFrameEl) {
    if (err) return;
    codeEl.parentNode.insertBefore(
      el('.preview', [ el('.resizeable', [ el(iFrameEl, { scrolling: 'no' }) ]) ]),
      codeEl
    );

    autoResizeTextArea(codeEl);

    codeEl._changeEvent = new CustomEvent('codechange');
    Object.defineProperty(codeEl, 'html', {
      get: function() {
        return this.value;
      },
      set: function(val) {
        this.value = val;
        this.dispatchEvent(this._changeEvent);
      }
    });
    codeEl.html = codeEl.value;
    var updateHtml = function() { this.html = this.value; };
    codeEl.addEventListener('keypress', updateHtml);
    codeEl.addEventListener('keyup', updateHtml);
  });

});

})();
