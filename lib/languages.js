# Methods for the supported stylesheet languages
# ==============================================

{exec} = require 'child_process'
fs     = require 'fs'
path   = require 'path'

class Language

  constructor: (@symbols, @preprocessor) ->
    @regexs = {}
    # We match only comments without any code on the same line.
    @regexs.single = new RegExp('^' + @symbols.single) if @symbols.single
    # Build regex's by splitting string and then joining with escape chars.
    @regexs.multiStart = new RegExp '^\\' + @symbols.multi[0].split('').join('\\')
    @regexs.multiEnd = new RegExp '\\' + @symbols.multi[1].split('').join('\\')

  # Check type of string.
  checkType: (str) ->
    # Check for multi-line comment symbols first to avoid matching single-line
    # comment symbols in multi-line blocks.
    if str.match(@regexs.multiStart) and str.match(@regexs.multiEnd)
      'single'
    else if str.match @regexs.multiStart
      'multistart'
    else if str.match @regexs.multiEnd
      'multiend'
    else if @regexs.single? and str.match @regexs.single
      'single'
    else
      'code'

  # Filter out comment symbols.
  filter: (str) ->
    for n, re of @regexs
      str = str.replace re, ''
    str

  # Compile to CSS.
  compile: (filename, customPreprocessor, cb) ->
    if @preprocessor? or customPreprocessor
      if customPreprocessor?
        preCmd = "#{customPreprocessor} #{filename}"
      else
        preCmd = "#{@preprocessor.cmd} #{@preprocessor.args.join ' '} #{filename}"
      exec preCmd, (err, stdout, stderr) ->
        if err?
          return cb new Error("There was an error processing #{filename}.\n#{err.message or stderr}")
        cb err, stdout
    else
      fs.readFile filename, 'utf-8', (err, data) ->
        cb err, data


# The supported stylesheet languages, their comment symbols and optional
# preprocessor command.
languages =
  '.css':  new Language({ multi: [ "/*", "*/" ] })
  '.scss': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'scss', args: [ '-t', 'compressed' ]})
  '.sass': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'sass', args: [ '-t', 'compressed' ]})
  '.less': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'lessc', args: [ '-x' ] })
  '.styl': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'stylus', args: [ '-c', '<' ] })


# Public functions
# ----------------

# Determine whether a file is of a supported file type.
exports.isSupported = (filename) -> path.extname(filename) of languages

# Get the correspoding language object from a file name.
exports.getLanguage = (filename) -> languages[path.extname filename]
