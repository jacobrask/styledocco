# General purpose utitily functions
# =================================

fs   = require 'fs'
path = require 'path'


# Trim newlines from beginning and end of multi line string.
exports.trimNewLines = (str) ->
  str.replace(/^\n*/, '').replace(/\n*$/, '')


# Build an HTML file name, depending on the source path.
exports.makeDestination = makeDestination = (file, inPath) ->
  relPath = path.relative(
    path.resolve(inPath)
    path.resolve(file)
  ) or inPath
  path.join(
    path.dirname(relPath)
    path.basename(relPath, path.extname(relPath)) + '.html'
  ).replace(/[\\/]/g, '-')


# Find first file matching `re` in `dir`.
exports.findFile = (dir, re) ->
  return null unless fs.statSync(dir).isDirectory()
  file = fs.readdirSync(dir).sort().filter((file) -> file.match re)?[0]
  return null unless file?
  path.join dir, file


# Make `link` objects for the menu.
exports.makeMenu = (files, inPath) ->
  menu = {}
  for file in files
    link =
      name: path.basename(file, path.extname file)
      href: 'html/' + makeDestination file, inPath
    parts = file.split('/').splice(1)
    key = if parts.length > 1 then parts[0] else './'
    if menu[key]?
      menu[key].push link
    else
      menu[key] = [ link ]
  menu
