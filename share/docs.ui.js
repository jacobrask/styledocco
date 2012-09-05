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

// Parse `key=value; key=value` strings (for cookies).
var keyvalParse = function(str) {
  var obj = {};
  var pairs = str.split(';');
  for (var i = 0; pairs.length > i; i++) {
    var kvs = pairs[i].trim().split('=');
    obj[kvs[0]] = kvs[1];
  }
  return obj;
};


var generateToC = function() {
  var tagNames = Array.prototype.slice.call(arguments);
  return getElementsByTagNames.apply(doc.body, tagNames).map(generateToC.makeToCItem);
};
generateToC.makeToCItem = function(h) {
  return el('li', [ el('a', {
    href: '#' + h.id,
    text: h.textContent,
    className: 'level' + h.tagName.toLowerCase()[1]
  }) ]);
};
var getElementsByTagNames = function() {
  var root = this || doc;
  return _(arguments)
    .map(function(tag) {
      return root.getElementsByTagName(tag);
    })
    .reduce(function(cur, prev) {
      return _(cur).concat(prev);
    })
    .sort(function(a, b) {
      // Sort element by position in DOM.
      // & 6 to get 2 (precedes) or 4 (follows) from compareDocumentPosition.
      return 3 - (a.compareDocumentPosition(b) & 6);
    });
};

var buildSearchResultsList = function(searchIndex) {
  return searchIndex.map(function(item) {
    var elem = el('li', { hidden: true }, [
      el('a', { href: item.url, text: item.title }, [
        el('span.nav-results-filename', [ item.filename ])
      ])
    ]);
    elem._title = item.title.toLowerCase();
    return elem;
  })
};

var filterSearchItems = function(items, value) {
  if (!value) return [];
  value = value.toLowerCase();
  return _(items).filter(function(item) {
    return (item._title.indexOf(value) !== -1);
  });
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

var toggleSiblingClassNames = function(className, el) {
  _(el.parentNode.children).pluck('classList').invoke('remove', className);
  el.classList.add(className);
};
var activateElement = toggleSiblingClassNames.bind(undefined, 'is-active');

(function() {
  var settingsEl = doc.body.getElementsByClassName('settings')[0];
  if (!doc.body.getElementsByClassName('preview-code').length || !settingsEl) return;

  var resizeableEls = doc.body.getElementsByClassName('resizeable');

  settingsEl.hidden = false;

  var resizePreviews = function(width) {
    doc.cookie = 'preview-width=' + width;
    _(resizeableEls).forEach(function(elem) {
      elem.style.width = (width === 'auto' ? elem.parentNode.offsetWidth : width) + 'px';
      elem.getElementsByTagName('iframe')[0].updateHeight();
    });
  };

  // Resize previews to the cookie value.
  var previewWidth = keyvalParse(doc.cookie)['preview-width'];
  if (previewWidth) {
    resizePreviews(previewWidth);
    activateElement(
      settingsEl.querySelector('button[data-width="' + previewWidth + '"]')
    );
  }

  // Resizing buttons
  settingsEl.addEventListener('click', function(ev) {
    var btn = ev.target;
    if (btn.tagName.toLowerCase() !== 'button') return;
    event.preventDefault();

    activateElement(btn);
    resizePreviews(btn.dataset.width);
  });
})();


(function() {
  var searchListEl = doc.getElementById('nav-search');
  if (!searchListEl) return;

  // XXX replace with single appendChild call
  buildSearchResultsList(searchIndex).forEach(function(item) {
    searchListEl.appendChild(item);
  });
  var items = searchListEl.children;
  if (!items.length) return;

  var searchEl = doc.getElementsByClassName('search')[0];

  var doSearch = function(ev) {
    _(items).forEach(function(item) { item.hidden = true; });
    var matches = filterSearchItems(items, this.value);
    if (matches.length) {
      _(matches).forEach(function(item) { item.hidden = false; });
      searchListEl.hidden = false;
    } else {
      searchListEl.hidden = true;
    }
  };
  searchEl.addEventListener('input', doSearch);
  searchEl.addEventListener('focus', doSearch);

  // Hide search results
  doc.body.addEventListener('click', function(ev) {
    if (ev.target === searchEl) return;
    searchListEl.hidden = true;
  });
  // Reset search box on navigation
  searchListEl.addEventListener('click', function(ev) {
    searchEl.value = '';
  });
})();

(function() {
  var ToCEl = doc.getElementById('nav-toc');
  if (!ToCEl) return;
  // Build ToC if we don't have one yet.
  doc.body.querySelector('button[data-toggle="nav-toc"]')
    .addEventListener('click', function() {
      if (!!ToCEl.childElementCount) return;
      generateToC('h1', 'h2', 'h3').forEach(function(item) { ToCEl.appendChild(item); });
    });
})();

doc.body.addEventListener('click', function(ev) {
  var activateDropdown = false;
  var elem = ev.target;
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
    autoResizeTextArea: autoResizeTextArea,
    generateToC: generateToC
  };
} else {
  window.styledocco = window.styledocco || {};
  window.styledocco.autoResizeTextArea = autoResizeTextArea;
  window.styledocco.generateToC = generateToC;
  window.styledocco.getElementsByTagNames = getElementsByTagNames;
}

})();
