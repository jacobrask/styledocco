 var makeDestination = require('../lib/utils').makeDestination;

 exports["Make destination"] = function(test) {
   test.equal(makeDestination('foo/bar/baz.css'), 'foo-bar-baz.html');
   test.equal(makeDestination('foo\\bar\\baz.css'), 'foo-bar-baz.html');
   test.equal(makeDestination('foo.css'), 'foo.html');
   test.done();
 };
