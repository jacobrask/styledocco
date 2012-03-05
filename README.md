     _______ __         __        _____
    |     __|  |_.--.--|  |-----.|     \-----.----.----.-----.
    |__     |   _|  |  |  |  -__||  --  | _  |  __|  __|  _  |
    |_______|____|___  |__|_____||_____/_____|____|____|_____|
                 |_____|


## About

StyleDocco generates documentation and style guide documents from your stylesheets.

It takes the comments from stylesheets and produces HTML documents that display your comments alongside your code, with any HTML snippets from the comments rendered using the processed stylesheets.

There is no special syntax, comments are just parsed with (GitHub flavored) Markdown. This means that the documentation will still make sense when reading the plain stylesheets, or if you decide to not keep using StyleDocco.

If your project includes a `README` file, it will be used as the base for an `index.html`. StyleDocco will also add some default styles to your documentation, but they are easy to modify to make it fit with your project.

StyleDocco will automatically compile any SASS, SCSS, Less or Stylus code before it is applied to the page.


## Install

StyleDocco requires [Node.js](http://nodejs.org).

`npm install -g styledocco`

or checkout this repository.

StyleDocco is free software, released under the MIT license.


## Usage

`styledocco [options] [INPUT]`

### Options

 * `--name`, `-n` Name of the project *(required)*
 * `--out`, `-o`  Output directory *(default: "docs")*
 * `--tmpl`       Directory for custom `index.jade` and `docs.jade` templates *(optional)*
 * `--overwrite`  Overwrite existing files (`docs.css`) in target directory.


## Examples

    /* <button class="btn primary">Primary</button>  
        Provides extra visual weight and identifies the primary action in a set of buttons */
    .btn.primary {
        background: blue;
        color: white;
    }

Would output an HTML document with one column displaying the rendered button followed by the description, and another column with the code. The code will also be included in a `style` element of the document.

See the `examples` folder for more in-depth examples.


## Acknowledgements

Thanks to:

 * [jashkenas](https://github.com/jashkenas/docco)
 * [mbrevoort](https://github.com/mbrevoort/docco-husky)
