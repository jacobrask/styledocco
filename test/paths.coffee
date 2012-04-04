{ makeDestination } = require '../src/utils'

exports["Make destination"] = (test) ->
  test.equal makeDestination('foo/bar/baz.css'), 'foo-bar-baz.html'
  test.equal makeDestination('foo\\bar\\baz.css'), 'foo-bar-baz.html'
  test.equal makeDestination('foo.css'), 'foo.html'
  test.done()
