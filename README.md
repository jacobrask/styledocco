StyleDocco
==========

StyleDocco generates documentation and style guide documents from your stylesheets.

Stylesheet comments will be parsed through [Markdown](http://en.wikipedia.org/wiki/Markdown) and displayed in a generated HTML document. You can write HTML code prefixed with 4 spaces or between [code fences](http://github.github.com/github-flavored-markdown/) (<code>```</code>) in your comments, and StyleDocco show a preview with the styles applied, and displays the example HTML code. 

The previews are rendered in a resizable iframes to make it easy to demonstrate responsive designs at different viewport sizes.

Suggestions, feature requests and bug reports are welcome either at [GitHub](https://github.com/jacobrask/styledocco/issues) or on Twitter ([@jacobrask](https://twitter.com/jacobrask)).


Installation
------------

StyleDocco requires [Node.js](http://nodejs.org). After installing Node.js, run `npm install -fg styledocco` or clone this repository and run `./bin/styledocco`.

StyleDocco is free and open source software, released under the [MIT license](https://raw.github.com/jacobrask/styledocco/master/LICENSE).


Usage
=====

`styledocco [options] [STYLESHEET(S)]`

Options
-------

 * `--name`, `-n`      Name of the project
 * `--out`, `-o`       Output directory *(default: "docs")*
 * `--preprocessor`    Custom preprocessor command. *(optional)* (ex: `--preprocessor "~/bin/lessc"`)
 * `--include`         Include specified CSS and/or JavaScript files in the previews. *(optional)* (ex: `--include mysite.css --include app.js`)
 * `--verbose`         Show log messages when generating the documentation. *(default: false)*
 *                     Stylesheet (or directory of stylesheets) to process.

Usage examples
--------------

Generate documentation for *My Project* in the `docs` folder, from the files in the `css` directory.

`styledocco -n "My Project" css`

Generate documentation for *My Project* in the `mydocs` folder, from source files in the `styles` folder. Use the `--compass` option for SASS to make Compass imports available.

`styledocco -n "My Project" -o mydocs -s mydocs --preprocessor "scss --compass" styles`


Syntax
------

```css
/* Provides extra visual weight and identifies the primary action in a set of buttons.

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

 * StyleDocco will automatically compile any SASS, SCSS, Less or Stylus files before they are applied to the page. You can also enter a custom preprocessor command if you want to pass custom parameters to the preprocessor.
 * If your project includes a `README.md` file, it will be used as the base for an `index.html`.
 * If you don't specify a custom name, StyleDocco will use the name from a `package.json` file if it finds one.
 * Put some whitespace before a comment block to exclude it from the documentation.
 * Level 1 headings will automatically create a new section in the documentation.
 * Add `:hover`, `:focus`, etc as class names in example code and the pseudo class styles will be applied in the preview.


Acknowledgements
----------------

A lot of the heavy lifting in StyleDocco is done by the excellent [Marked](https://github.com/chjj/marked) module by Christopher Jeffrey. The original [Docco](https://github.com/jashkenas/docco) by Jeremy Ashkenas and [Knyle Style Sheets](https://github.com/kneath/kss) have also been sources of inspiration for StyleDocco.
