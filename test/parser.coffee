fs = require 'fs'

parser = require '../src/parser'

files =
  structured: "#{__dirname}/fixtures/css/structured.css"
  normal:     "#{__dirname}/fixtures/css/normal.css"
  invalid:    "#{__dirname}/fixtures/css/invalid.css"

exports["Get documentation tokens"] = (test) ->
  tokens = parser.getDocTokens files.structured
  test.equal tokens.length, 8, "Wrong number of tokens in #{files.structured}"
  test.equal tokens[0].type, 'heading', "The first token in #{files.structured} should be a heading"

  tokens = parser.getDocTokens files.normal
  test.equal tokens.length, 2, "Wrong number of tokens in #{files.normal}"

  tokens = parser.getDocTokens files.invalid
  test.equal tokens.length, 4, "Wrong number of tokens in #{files.invalid}"
  test.equal tokens[0].type, 'heading', "The first token in #{files.invalid} should be a heading"
  test.done()


exports["Make sections"] = (test) ->
  sections = parser.makeSections parser.getDocTokens files.structured
  test.equal sections.length, 3, "Wrong number of sections in #{files.structured}"
  test.equal sections[0][0].type, 'heading', "The first token in the first section of #{files.structured} should be a heading"

  sections = parser.makeSections parser.getDocTokens files.normal
  test.equal sections.length, 1, "Wrong number of sections in #{files.normal}"
  
  sections = parser.makeSections parser.getDocTokens files.invalid
  test.equal sections.length, 2, "Wrong number of sections in #{files.invalid}"
  test.done()
