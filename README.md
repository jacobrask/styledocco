```
 _______ __          __         _____
|     __|  |_.--.--.|  |.-----.|     \.-----..----..----..-----.
|__     |   _|  |  ||  ||  -__||  --  |  _  ||  __||  __||  _  |
|_______|____|___  ||__||_____||_____/|_____||____||____||_____|
             |_____|
```

About
-----

StyleDocco takes your stylesheets and generates style guide documents with the stylesheets in question applied to the documents.

`styledocco main.css` will generate `docs/main.html` with all the comments from the file (passed through GitHub flavored Markdown) in one column, and all the code in another column.

The CSS in `main.css` will be applied to the page. This means you can add sample HTML content in the comments of your CSS file, and have it rendered in the browser using that same CSS.

To add extra styles to your documentation, add a file named `docs.css` in your `docs` folder.

If you point StyleDocco to a directory, it will add a menu to navigate between the different files (ignoring hidden files and SASS partials). If your project includes a `README` file, it will be used as the base for an `index.html`.

StyleDocco will automatically compile any SASS, SCSS, Less or Stylus code before it is applied to the page.


Install
-------

`npm install styledocco`


Examples
--------

```
/* <button class="btn btn-primary">Primary</button>   
   Provides extra visual weight and identifies the primary action in a set of buttons */
.btn.btn-primary {
  background: blue;
  color: white;
}
```

Would output an HTML document with one column displaying the rendered button followed by the description, and another column with the code. The code will also be included in a `style` element of the document.


Acknowledgements
----------------

Thanks to:

 * [jashkenas](https://github.com/jashkenas/docco)
 * [mbrevoort](https://github.com/mbrevoort/docco-husky)
