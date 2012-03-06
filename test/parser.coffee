parser = require '../src/parser'
{ getLanguage } = require '../src/languages'

css = """
/* _foo_ */
body { color: red; }
/* BAR */
"""

exports["Parse documentation"] = (test) ->
  docs = parser.getDocs getLanguage('test.css'), css
  test.equal docs.trim(), '_foo_ \n BAR'
  test.done()
