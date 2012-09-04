(function () {

'use strict';

var _, domsugar, renderPreview;
if (typeof module == "object" && typeof require == "function") {
  _ = require('./iterhate');
  domsugar = require('./domsugar');
} else {
  _ = window.iterhate;
  domsugar = window.domsugar;
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
  var mirrorEl = el('div', { className: origEl.className,
                             style: { position: 'absolute', left: '-9999px' }});
  origEl.parentNode.appendChild(mirrorEl);
  var borderHeight = getStyle(origEl, 'border-top') +
                     getStyle(origEl, 'border-bottom');
  var maxHeight = getStyle(origEl, 'max-height');

  var origDidChange = function(ev) {
    mirrorEl.textContent = origEl.value + '\n';
    var height = mirrorEl.offsetHeight;
    origEl.style.height = (height - borderHeight) + 'px';
    origEl.style.overflowY = (maxHeight && height >= maxHeight) ? 'auto' : 'hidden';
  };
  origEl.addEventListener('input', origDidChange);
  origDidChange.call(origEl);

  return origEl;
};

var clearPopOvers = function() {
  _(doc.body.querySelectorAll('[data-toggle]')).forEach(function(elem) {
    elem.classList.remove('is-active');
    doc.getElementById(elem.dataset.toggle).hidden = true;
  });
};
var activatePopOver = function(elem) {
  elem.classList.add('is-active');
  doc.getElementById(elem.dataset.toggle).hidden = false;
};



doc.body.addEventListener('click', function(ev) {
  var activateDropdown = false;
  var elem = ev.target;
  if (elem.tagName.toLowerCase() === 'svg') elem = elem.parentNode; // Button icons
  if (elem.dataset.toggle != null) {
    event.preventDefault();
    // Clicked on an inactive dropdown toggle
    if (!elem.classList.contains('is-active')) activateDropdown = true;
  }
  clearPopOvers();
  // Activate the clicked dropdown
  if (activateDropdown) activatePopOver(elem);
});

_(doc.querySelectorAll('textarea.preview-code')).forEach(function(codeEl) {
  autoResizeTextArea(codeEl);
});


if (typeof module != 'undefined' && module.exports) {
  module.exports = {
    autoResizeTextArea: autoResizeTextArea
  };
} else {
  window.styledocco = window.styledocco || {};
  window.styledocco.autoResizeTextArea = autoResizeTextArea;
}

})();
