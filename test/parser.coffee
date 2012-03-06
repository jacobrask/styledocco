parser = require '../src/parser'
{ getLanguage } = require '../src/languages'

css = """
/* foo */
body { color: red; }
"""

exports["Parse CSS"] = (test) ->
  sections = parser getLanguage('test.css'), css
  test.equal sections[0].docs.trim(), 'foo'
  test.equal sections[0].code, "body { color: red; }\n"
  test.done()
