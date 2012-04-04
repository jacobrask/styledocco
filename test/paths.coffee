{ buildRootPath, makeDestination } = require '../src/utils'

exports["Build root path"] = (test) ->
  test.equal buildRootPath('foo/bar/baz'), '../../'
  test.equal buildRootPath('foo/bar'), '../'
  test.equal buildRootPath('foo\\bar\\baz'), '../../'
  test.equal buildRootPath('foo'), './'
  test.equal buildRootPath(''), './'
  test.done()
