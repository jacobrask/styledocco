{ buildRootPath, makeDestination } = require '../src/utils'

exports["Build root path"] = (test) ->
  test.equal buildRootPath('foo/bar/baz'), '../../'
  test.equal buildRootPath('foo/bar'), '../'
  test.equal buildRootPath('foo\\bar\\baz'), '../../'
  test.equal buildRootPath('foo'), './'
  test.equal buildRootPath(''), './'
  test.done()

exports["Make destination"] = (test) ->
  test.equal makeDestination('foo/bar/baz.css'), 'foo_bar_baz.html'
  test.equal makeDestination('foo\\bar\\baz.css'), 'foo_bar_baz.html'
  test.equal makeDestination('foo.css'), 'foo.html'
  test.done()
