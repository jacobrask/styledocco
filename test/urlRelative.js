var urlsRelative = require('../cli').urlsRelative
  , expect = require('chai').expect
  ;

// Allow non-mocha frameworks to skip over these tests.
if (!global.describe) { process.exit(); }

describe('urlsRelative', function() {
    var path = 'root';
    var nested_path = 'nested/root';
    var error_msg = '1st and 2nd args must be strings.'

    var long_css = {
        orig: [
           'body { background: url("foo.gif"); }'
         , 'h1 { background: url("bar.gif"); }'
         , 'h2 { background: url("../bar.gif"); }'
         , 'h3 { background: url("/bar.gif"); }'
        ],
        with_path: [
           'body { background: url("root/foo.gif"); }'
         , 'h1 { background: url("root/bar.gif"); }'
         , 'h2 { background: url("root/../bar.gif"); }'
         , 'h3 { background: url("/bar.gif"); }'
        ],
        with_nested_path: [
           'body { background: url("nested/root/foo.gif"); }'
         , 'h1 { background: url("nested/root/bar.gif"); }'
         , 'h2 { background: url("nested/root/../bar.gif"); }'
         , 'h3 { background: url("/bar.gif"); }'
        ]
    };

    var stubs = {
        dbl_quotes: {
            samedir: {
                orig:             'body { background: url("foo.gif"); }',
                with_path:        'body { background: url("root/foo.gif"); }',
                with_nested_path: 'body { background: url("nested/root/foo.gif"); }'
            },
            reldir: 'body { background: url("../foo.gif"); }',
            rootdir: 'body { background: url("/foo.gif"); }'
        },
        sgl_quotes: {
            samedir: "body { background: url('foo.gif'); }",
            reldir: "body { background: url('../foo.gif'); }",
            rootdir: "body { background: url('/foo.gif'); }"
        },
        no_quotes: {
            samedir: 'body { background: url(foo.gif); }',
            reldir: 'body { background: url(../foo.gif); }',
            rootdir: 'body { background: url(/foo.gif); }'
        },
        nested_file: {
            samedir: 'body { background: url(path/to/foo.gif); }',
            reldir: 'body { background: url(../path/to/foo.gif); }',
            rootdir: 'body { background: url(/path/to/foo.gif); }'
        },
        multi_line: {
            orig: long_css.orig.join('\n'),
            with_path: long_css.with_path.join('\n'),
            with_nested_path: long_css.with_nested_path.join('\n')
        },
        multi_url: {
            orig: long_css.orig.join(' '),
            with_path: long_css.with_path.join(' '),
            with_nested_path: long_css.with_nested_path.join(' ')
        }
    };


    it('requires a string for its 1st argument', function() {
        try { urlsRelative(); }
        catch (e) { expect(e.message).to.equal(error_msg); }
    });

    it('requires a string for its 2nd argument', function() {
        try { urlsRelative('string'); }
        catch (e) { expect(e.message).to.equal(error_msg); }
    });

    describe('when the url path is relative to doc root', function() {
        it('does not modify the url path', function() {
            var stub = stubs.dbl_quotes.rootdir;
            expect(urlsRelative(stub, path)).to.equal(stub);

            stub = stubs.sgl_quotes.rootdir;
            expect(urlsRelative(stub, path)).to.equal(stub);

            stub = stubs.no_quotes.rootdir;
            expect(urlsRelative(stub, path)).to.equal(stub);

            stub = stubs.nested_file.rootdir;
            expect(urlsRelative(stub, path)).to.equal(stub);
        });
    });

    describe('when the asset is in the same directory as the css file', function() {
        var samedir = stubs.dbl_quotes.samedir;
        it('makes url path relative to a given path with no trailing / for path in double quotes', function() {
            expect(urlsRelative(samedir.orig, path)).to.equal(samedir.with_path);
        });

        it('makes url path relative to a given path with trailing / for path in double quotes', function() {
            expect(urlsRelative(samedir.orig, path + '/')).to.equal(samedir.with_path);
        });

        it('makes url path relative to a given path with infix / for path in double quotes', function() {
            expect(urlsRelative(samedir.orig, path)).to.equal(samedir.with_path);
        });

        it('makes url path relative to a given path with infix and trailing / for path in double quotes', function() {
            expect(urlsRelative(samedir.orig, nested_path + '/')).to.equal(samedir.with_nested_path);
        });

        it('makes url path in single quotes relative to a given path', function() {
            expect(urlsRelative(samedir.orig, path)).to.equal(samedir.with_path);
        });

        it('makes url path with no quotes relative to a given path', function() {
            expect(urlsRelative(samedir.orig, path)).to.equal(samedir.with_path);
        });

    });

    it('makes nested url path relative to a given path', function() {
        expect(urlsRelative(stubs.no_quotes.samedir, path)).to.equal("body { background: url(root/foo.gif); }");
    });

    it('works for multiple matches on the same line', function() {
        expect(urlsRelative(stubs.multi_url.orig, path)).to.equal(stubs.multi_url.with_path);
    });

});
