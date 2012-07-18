// Entry file for Browserify

(function () {

'use strict';

// Don't run this script if we're rendering a preview page.
if (location.href === '#preview') return;

var $ = require('jquery-browserify');

// Get preview styles intended for preview iframes.
var styles = $('style[type="text/preview"]').toArray().reduce(
  function(styles, el) { return styles + el.innerHTML; },
'');

var $body = $('body').first();

// Loop through code previews and replace with iframes.
$('.preview').each(function() {
  var $oldPreview = $(this);
  // Insert a new iframe with the current document as src.
  // In Chrome this will count as same-origin, in other browsers it will
  // not load if it's on file systems, but still be script-modifiable.
  var $iframe = $(document.createElement('iframe'))
                  .attr('seamless', 'seamless')
                  .data('code', $oldPreview.html());
  // Iframes cannot be resized with CSS, we need a wrapper element.
  var $preview = $(document.createElement('div')).addClass('preview')
  var $resize = $(document.createElement('div')).addClass('resize loading')
  $resize.append($iframe);
  $preview.append($resize);
  $oldPreview.replaceWith($preview);

  $iframe.on('load', function(event) {
    // Use iframe's document object.
    var doc = this.contentDocument;
    var oldHeadEl = doc.getElementsByTagName('head')[0];
    var $body = $('body', doc).first();

    // Replace iframe content with the preview HTML.
    $body.html($iframe.data('code'));

    // Add preview specific scripts and styles. We can't use jQuery methods
    // here due to the way it handles script insertion.
    var scriptEl = doc.createElement('script');
    scriptEl.src = 'previews.js';
    var styleEl = doc.createElement('style');
    styleEl.innerHTML = styles;
    var headEl = doc.createElement('head');
    headEl.appendChild(scriptEl);
    headEl.appendChild(styleEl);
    oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);

    // Set the height of the iframe element to match the content.
    $preview.removeClass('loading');
    $iframe.css('height', $body.outerHeight());
  });
  $iframe.attr('src', location.href + '#preview');
});

// Allow `resize` to shrink in WebKit by setting width/height to 0 when
// starting to resize.
$('.resize').on('mousemove', function(event) {
  var $el = $(this);
  if (!$el.data('wasResized')) {
    if (($el.data('oldWidth') || $el.data('oldHeight')) &&
        ($el.data('oldWidth') !== $el.width() ||
         $el.data('oldHeight') !== $el.height())) {
      $el.css('width', 0).css('height', 0);
      $el.data({ wasResized: true, oldWidth: null, oldHeight: null });
      $el.find('iframe').first().css('height', '100%');
    }
    $el.data({ oldWidth: $el.width(), oldHeight: $el.height() });
  }
});

// Dropdown menu
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

}());
