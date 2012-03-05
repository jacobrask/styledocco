{ getLanguage } = require '../src/languages'

exports["CSS comment types"] = (test) ->
  lang = getLanguage('foo.css')
  test.equal lang.checkType('  /* ** FOO bar -- **'), 'multistart'
  test.equal lang.checkType(' ** FOO bar -- **/ '), 'multiend'
  test.equal lang.checkType('/** FOO bar -- **/ '), 'single', "Multi line comment spanning only one line is a single line comment"
  test.done()

exports["SASS comment types"] = (test) ->
  lang = getLanguage('foo.scss')
  test.equal lang.checkType('  /* ** FOO bar -- **'), 'multistart'
  test.equal lang.checkType(' // FOO bar -- // '), 'single'
  test.equal lang.checkType(' ** FOO bar -- **/ '), 'multiend'
  test.equal lang.checkType(' // **/ '), 'multiend', "Multi comment containing single comment symbol"
  test.done()
  
exports["Less comment types"] = (test) ->
  lang = getLanguage('foo.less')
  test.equal lang.checkType('  /* ** FOO bar -- **'), 'multistart'
  test.equal lang.checkType(' // FOO bar -- // '), 'single'
  test.equal lang.checkType(' ** FOO bar -- **/ '), 'multiend'
  test.equal lang.checkType(' // **/ '), 'multiend', "Multi comment containing single comment symbol"
  test.done()

exports["Filter out comments"] = (test) ->
  lang = getLanguage('foo.css')
  test.equal lang.filter('/* Comment */'), ' Comment '
  lang = getLanguage('foo.scss')
  test.equal lang.filter('// Comment'), ' Comment'
  test.done()
