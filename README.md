     _______ __         __        _____
    |     __|  |_.--.--|  |-----.|     \-----.----.----.-----.
    |__     |   _|  |  |  |  -__||  --  | _  |  __|  __|  _  |
    |_______|____|___  |__|_____||_____/_____|____|____|_____|
                 |_____|


About
-----

StyleDocco takes your stylesheets and generates style guide documents with the processed stylesheets applied to the documents.

`styledocco --name 'My Site' main.css` will generate `docs/main.html` with all the comments from the file (passed through GitHub flavored Markdown) in one column, and all the code in another column.

The CSS in `main.css` will be applied to the page. This means you can add sample HTML content in the comments of your CSS file, and have it rendered in the browser using that same CSS.

To add extra default styles to your documentation, add a file named `docs.css` in your `docs` folder.

If you point StyleDocco to a directory, it will add a menu to navigate between the different files. If your project includes a `README` file, it will be used as the base for an `index.html`.

StyleDocco will automatically compile any SASS, SCSS, Less or Stylus code before it is applied to the page. Hidden files and SASS partials will be ignored.


Install
-------

StyleDocco requires [Node.js](http://nodejs.org).

`npm install -g styledocco`


Usage
-----

`styledocco [options] [INPUT]`

**Options**

 * `--name`, `-n` Name of the project *(required)*
 * `--out`, `-o`  Output directory *(default: "docs")*
 * `--tmpl`       Directory for custom `index.jade` and `docs.jade` templates *(optional)*


Examples
--------

    /* <button class="btn primary">Primary</button>  
        Provides extra visual weight and identifies the primary action in a set of buttons */
    .btn.primary {
        background: blue;
        color: white;
    }

Would output an HTML document with one column displaying the rendered button followed by the description, and another column with the code. The code will also be included in a `style` element of the document.

See the `examples` folder for more in-depth examples.


Acknowledgements
----------------

Thanks to:

 * [jashkenas](https://github.com/jashkenas/docco)
 * [mbrevoort](https://github.com/mbrevoort/docco-husky)
