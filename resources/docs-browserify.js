// Entry file for Browserify

(function () {

'use strict';

// Don't run this script if we're rendering a preview page.
if (location.href === '#preview') return;

var getContentHeight = function(el) {
  return el.contentDocument.getElementsByTagName('html')[0].scrollHeight;
};


var $ = require('jquery-browserify');

var sumHtml = function(code, el) { return code + el.innerHTML; };
// Get preview styles intended for preview iframes.
var styles = $('style[type="text/preview"]').toArray().reduce(sumHtml, '');
// Get preview scripts intended for preview iframes.
var scripts = $('script[type="text/preview"]').toArray().reduce(sumHtml, '');

var $body = $('body').first();

// Loop through code previews and replace with iframes.
$('.preview').each(function() {
  var $oldPreview = $(this);
  var $iframe = $(document.createElement('iframe'))
                  .attr('seamless', 'seamless')
                  .data('code', $oldPreview.html());
  // Iframes cannot be resized with CSS, we need a wrapper element.
  var $preview = $(document.createElement('div')).addClass('preview')
  var $resizeable = $(document.createElement('div')).addClass('resizeable is-loading')
  $resizeable.append($iframe);
  $preview.append($resizeable);
  $oldPreview.replaceWith($preview);

  $iframe.on('load', function(event) {
    // Use iframe's document object.
    var doc = this.contentDocument;

    // Replace iframe content with the preview HTML.
    $('body', doc).first().html($iframe.data('code'));

    // Add preview specific scripts and styles. We can't use jQuery methods
    // here due to the way it handles script insertion using XHR.
    var headEl = doc.createElement('head');
    var styleEl = doc.createElement('style');
    styleEl.innerHTML = styles;
    headEl.appendChild(styleEl);
    var scriptEl = doc.createElement('script');
    var src = location.href.split('/');
    src.pop(); src.push('previews.js');
    scriptEl.src = src.join('/');
    headEl.appendChild(scriptEl);
    if (scripts.length) {
      var previewScriptEl = doc.createElement('script');
      previewScriptEl.innerHTML = scripts;
      headEl.appendChild(previewScriptEl);
    }
    var oldHeadEl = doc.getElementsByTagName('head')[0];
    oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);
    $preview.removeClass('loading');

    // Set the height of the iframe element to match the content.
    $iframe.height(getContentHeight($iframe[0]));
  });
  if ($.browser.webkit) {
    // WebKit doesn't treat data uris as same origin [https://bugs.webkit.org/show_bug.cgi?id=17352]
    // Even with try/catch, errors will be thrown, so there's no good way to feature detect.
    $iframe.attr('src', location.href + '#preview');
  } else {
    // Set source to an empty HTML document.
    $iframe.attr('src', 'data:text/html,%3C!doctype%20html%3E%3Chtml%3E%3Chead%3E%3C%2Fhead%3E%3Cbody%3E');
  }
});

// Dropdown menus
$body.on('click', function(event) {
  var $el = $(event.target);
  var activateDropdown = false;
  if ($el.hasClass('dropdown-toggle')) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!$el.hasClass('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  $('.dropdown-toggle').each(function() {
    $(this).removeClass('is-active')
      .next('.dropdown').removeClass('is-active');
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    $el.addClass('is-active');
    $el.next('.dropdown').addClass('is-active');
  }
});

// Resizing buttons
$('.settings').on('click', 'button', function(event) {
  var $el = $(event.target);
  $el.addClass('is-active');
  $el.siblings().removeClass('is-active');
  $('.resizeable')
    .animate({ width: $el.data('width') }, 250, function(el) {
      var $iframe = $(this).find('iframe').first();
      $iframe.animate({ height: getContentHeight($iframe[0]) }, 100);
    });
});


}());
