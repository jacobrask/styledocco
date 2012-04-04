# General purpose utitily functions
# =================================

fs   = require 'fs'
path = require 'path'


# Trim newlines from beginning and end of multi line string.
exports.trimNewLines = (str) ->
  str.replace(/^\n*/, '').replace(/\n*$/, '')


# Build an HTML file name, depending on the source path.
exports.makeDestination = (file) ->
  path.join(
    path.dirname(file)
    path.basename(file, path.extname(file)) + '.html'
  ).replace(/[\\/]/g, '-')


# Find first file matching `re` in `dir`.
exports.findFile = (dir, re) ->
  return null unless fs.statSync(dir).isDirectory()
  file = fs.readdirSync(dir).filter((file) -> file.match re)?[0]
  return null unless file?
  path.join dir, file
