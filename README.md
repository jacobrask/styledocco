```
 _______ __         __        _____
|     __|  |_.--.--|  |-----.|     \-----.----.----.-----.
|__     |   _|  |  |  |  -__||  --  | _  |  __|  __|  _  |
|_______|____|___  |__|_____||_____/_____|____|____|_____|
             |_____|
```

StyleDocco generates documentation and style guide documents from your stylesheets.

Stylesheet comments will be parsed through [Markdown](http://en.wikipedia.org/wiki/Markdown) and displayed in a generated HTML document. You can write code examples prefixed with 4 spaces (or between <code>```</code>, [GitHub code fences](http://github.github.com/github-flavored-markdown/)) in your comments, and StyleDocco both renders the HTML and shows the code example.

An important philosophy of StyleDocco is to introduce as little custom syntax as possible, maintaining the stylesheet comments readable and useful even without StyleDocco.

The document is automatically split into new sections when it encounters a level 1 or 2 heading. Read more about the heading syntax in the [Markdown guide](http://daringfireball.net/projects/markdown/syntax). Only comments at the beginning of new lines are included, put some whitespace before a comment to exlude it from the style guide.

Suggestions, feature requests and bug reports are very welcome, either at [GitHub](https://github.com/jacobrask/styledocco/issues) or on Twitter ([@jacobrask](https://twitter.com/jacobrask)).


## Installation

StyleDocco requires [Node.js](http://nodejs.org).

`npm install -g styledocco`

or check out this repository.

StyleDocco is free software, released under the [MIT license](https://raw.github.com/jacobrask/styledocco/master/LICENSE).


## Usage

`styledocco [options] [INPUT]`

StyleDocco will automatically compile any SASS, SCSS, Less or Stylus files before they are applied to the page. You can also enter a custom preprocessor command if you want to pass custom parameters to the preprocessor.

If your project includes a `README` file, it will be used as the base for an `index.html`. StyleDocco will also add some default styles to your documentation, but they are easy to modify to make it fit with your project.

### Options

 * `--name`, `-n`   Name of the project *(required)*
 * `--out`, `-o`    Output directory *(default: "docs")*
 * `--tmpl`         Directory for custom `docs.jade` template and `docs.css` *(optional)*
 * `--overwrite`    Overwrite existing files (`docs.css`) in target directory. *(default: false)*
 * `--preprocessor` Custom preprocessor command. *(optional)* (ex: `--preprocessor "scss --load-path=deps/"`)

### Usage examples

Generate documentation for *My Project* in the `docs` folder, from the files in the `css` directory.

`styledocco -n "My Project" css`

Generate documentation for *My Project* in the `mydocs` folder, from source files in the `styles` folder. Use the Less binary in `~/bin/lessc`.

`styledocco -n "My Project" -o mydocs --preprocessor "~/bin/lessc" styles`


## Syntax examples

    /*
        <button class="btn primary">Primary</button>

    Provides extra visual weight and identifies the primary action in a set of buttons. */
    .btn.primary {
        background: blue;
        color: white;
    }

Would display the description, a button as well as the example HTML code. The CSS will be included in the `style` element of the document.

See the `examples` folder for more in-depth examples.


## Acknowledgements

A lot of the heavy lifting in StyleDocco is done by the excellent [Marked](https://github.com/chjj/marked) module by Christopher Jeffrey. The original [Docco](https://github.com/jashkenas/docco) by Jeremy Ashkenas and [Docco Husky](https://github.com/mbrevoort/docco-husky) by Mike Brevoort were also of great help to this project. [Knyle Style Sheets](https://github.com/kneath/kss) is a similar project written in Ruby, and has also been an inspiration to StyleDocco.
