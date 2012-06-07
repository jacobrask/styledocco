fs = require 'fs'
path = require 'path'

langs  = require '../src/languages'
parser = require '../src/parser'

cssDir = "#{__dirname}/fixtures/css"

exports["Extract docs+code blocks"] = (test) ->
  # Compares CSS files in fixtures directory with their corresponding
  # `.blocks.json` file.
  cssFiles = fs.readdirSync(cssDir).filter (filename) ->
    path.extname(filename) is '.css'
  for file in cssFiles
    extracted = parser.extractBlocks(
      langs.getLanguage file
      fs.readFileSync path.join(cssDir, file), 'utf-8'
    )
    saved = JSON.parse fs.readFileSync(
      "#{cssDir}/#{path.basename file, path.extname(file)}.blocks.json", 'utf-8'
    )
    test.deepEqual extracted, saved, "Match failed for #{cssDir}/#{file}"
  test.done()

exports["Get documentation tokens"] = (test) ->
  cssFiles = fs.readdirSync(cssDir).filter (filename) ->
    path.extname(filename) is '.css'
  for file in cssFiles
    # Stringify and parse back to remove empty elements.
    extracted = JSON.parse JSON.stringify parser.makeSections(
      parser.extractBlocks(
        langs.getLanguage file
        fs.readFileSync path.join(cssDir, file), 'utf-8'
      )
    )
    saved = JSON.parse fs.readFileSync(
      "#{cssDir}/#{path.basename file, path.extname(file)}.sections.json", 'utf-8'
    )
    test.deepEqual extracted, saved, "Match failed for #{cssDir}/#{file}"
  test.done()
