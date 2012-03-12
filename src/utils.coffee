# General purpose utitily functions
# =================================

path = require 'path'

# Trim newlines from beginning and end of multi line string.
exports.trimNewLines = (str) ->
  str.replace(/^\n*/, '').replace(/\n*$/, '')


# Compute the destination HTML path for an input source file path,
# relative to the output directory.
exports.makeDestination = (file) ->
  path.join path.dirname(file), path.basename(file, path.extname(file)) + '.html'


# Build a path to the documentation root.
exports.buildRootPath = (str) ->
  if path.dirname(str) is '.'
    root = path.dirname(str)
  else
    root = path.dirname(str).replace(/[^\/]+/g, '..')
  root += '/' unless root.slice(-1) is '/'
  root

