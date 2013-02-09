StyleDocco
==========

StyleDocco generates style guide documents from your stylesheets by parsing your stylesheet comments through [Markdown](http://en.wikipedia.org/wiki/Markdown).

You can write HTML snippets in your stylesheet comments, prefixed with 4 spaces or between [code fences](http://github.github.com/github-flavored-markdown/) (<code>```</code>), and StyleDocco will show a preview with the styles applied, as well as display the example HTML code. The previews are rendered in a resizable iframes to make it easy to demonstrate responsive designs at different viewport sizes.

Suggestions, feature requests and bug reports are welcome either at [GitHub](https://github.com/jacobrask/styledocco/issues) or on Twitter ([@jacobrask](https://twitter.com/jacobrask)).

Installation
------------

StyleDocco is free and open source software, released under the [MIT license](https://raw.github.com/jacobrask/styledocco/master/LICENSE).


Usage
=====

Syntax
------

```css
/** Provides extra visual weight and identifies the primary action in a set of buttons.

    <button class="btn primary">Primary</button> */
.btn.primary {
    background: blue;
    color: white;
}
```

Would display the description, a rendered button as well as the example HTML code. The CSS will be applied to the preview.

See the `examples` folder for more in-depth examples.

Tips and tricks
---------------

 * Add `:hover`, `:focus`, etc as class names in example code and the pseudo class styles will be applied in the preview.


Acknowledgements
----------------

A lot of the heavy lifting in StyleDocco is done by the excellent [Marked](https://github.com/chjj/marked) module by Christopher Jeffrey. The original [Docco](https://github.com/jashkenas/docco) by Jeremy Ashkenas and [Knyle Style Sheets](https://github.com/kneath/kss) have also been sources of inspiration for StyleDocco.
