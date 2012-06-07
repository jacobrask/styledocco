var getLanguage = require('../lib/languages').getLanguage;

exports["CSS comment types"] = function(test) {
  var lang = getLanguage('foo.css');
  test.equal(lang.checkType('/* ** FOO bar -- **'), 'multistart');
  test.equal(lang.checkType(' /* Foo'), 'code', "Ignore comments not at start of line");
  test.equal(lang.checkType('** FOO bar -- **/ '), 'multiend');
  test.equal(lang.checkType('/** FOO bar -- **/ '), 'single', "Multi line comment spanning only one line is a single line comment");
  test.done();
};

exports["SASS comment types"] = function(test) {
  var lang = getLanguage('foo.scss');
  test.equal(lang.checkType('/* *F *oo'), 'multistart');
  test.equal(lang.checkType('// Foo // '), 'single');
  test.equal(lang.checkType('   // Foo // '), 'code', "Ignore comments not at start of line");
  test.equal(lang.checkType('** FOO bar -- **/ '), 'multiend');
  test.equal(lang.checkType('// **/ '), 'multiend', "Multi comment containing single comment symbol");
  test.done();
};

exports["Less comment types"] = function(test) {
  var lang = getLanguage('foo.less');
  test.equal(lang.checkType('/* ** FOO bar -- **'), 'multistart');
  test.equal(lang.checkType('// FOO bar -- // '), 'single');
  test.equal(lang.checkType('   // Foo'), 'code', "Ignore comments not at start of line");
  test.equal(lang.checkType('** FOO bar -- **/ '), 'multiend');
  test.equal(lang.checkType('// **/ '), 'multiend', "Multi comment containing single comment symbol");
  test.done();
};

exports["Filter out comments"] = function(test) {
  var lang = getLanguage('foo.css');
  test.equal(lang.filter('/* Comment */'), ' Comment ');
  lang = getLanguage('foo.scss');
  test.equal(lang.filter('// Comment'), ' Comment');
  test.done();
};
