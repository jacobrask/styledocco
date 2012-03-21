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
    @regexs.multi_start = new RegExp '^\\' + @symbols.multi[0].split('').join('\\')
    @regexs.multi_end = new RegExp '\\' + @symbols.multi[1].split('').join('\\')

  # Check type of string.
  checkType: (str) ->
    if str.match(@regexs.multi_start) and str.match(@regexs.multi_end) \
    or @regexs.single? and str.match @regexs.single
      'single'
    else if str.match @regexs.multi_start
      'multistart'
    else if str.match @regexs.multi_end
      'multiend'
    else
      'code'

  # Filter out comment symbols.
  filter: (str) ->
    for n, re of @regexs
      str = str.replace re, ''
    str

  # Compile to CSS.
  compile: (filename, passthroughArgs, cb) ->
    if @preprocessor?
      args =
        if passthroughArgs? and typeof passthroughArgs is 'string'
          @preprocessor.args.concat([passthroughArgs])
        else
          @preprocessor.args
      exec "#{@preprocessor.cmd} #{args.join(' ')} #{filename}",
        (err, stdout, stderr) ->
          cb err, stdout
    else
      fs.readFile filename, 'utf-8', (err, data) ->
        cb err, data


# The supported stylesheet languages, their comment symbols and optional
# preprocessor command.
languages =
  '.css':  new Language({ multi: [ "/*", "*/" ] })
  '.scss': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'scss', args: [ '-t', 'compressed' ] })
  '.sass': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'sass', args: [ '-t', 'compressed' ] })
  '.less': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'lessc', args: [ '-x' ] })
  '.styl': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'stylus', args: [ '-c', '<' ] })


# Public functions
# ------------------

# Determine whether a file is of a supported file type.
exports.isSupported = (filename) -> path.extname(filename) of languages

# Get the correspoding language object from a file name.
exports.getLanguage = (filename) -> languages[path.extname filename]
