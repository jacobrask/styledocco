# Methods for the supported stylesheet languages
# ----------------------------------------------

{exec} = require 'child_process'
fs     = require 'fs'
path   = require 'path'

class Language

  constructor: (@symbols, @preprocessor) ->
    @regexs = {}
    @regexs.single = new RegExp('^\\s*' + @symbols.single) if @symbols.single
    # FIXME: Hard coded /* */ for now
    @regexs.multi_start = new RegExp(/^[\s]*\/\*/)
    @regexs.multi_end = new RegExp(/\*\//)

  # Check type of string
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

  # Filter out comment symbols
  filter: (str) ->
    for n, re of @regexs
      str = str.replace re, ''
    str

  compile: (filename, cb) ->
    if @preprocessor?
      exec "#{@preprocessor.cmd} #{@preprocessor.args.join(' ')} #{filename}",
        (err, stdout, stderr) ->
          cb err, stdout
    else
      fs.readFile filename, 'utf-8', (err, data) ->
        cb err, data


# A list of the supported stylesheet languages, their comment symbols
# and optional preprocessor command.
exports.languages = languages =
  '.css':  new Language({ multi: [ "/*", "*/" ] })
  '.scss': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'scss', args: [ '-t', 'compressed' ] })
  '.sass': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'sass', args: [ '-t', 'compressed' ] })
  '.less': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'lessc', args: [ '-x' ] })
  '.styl': new Language({ single: '//', multi: [ "/*", "*/" ] },
                        { cmd: 'stylus', args: [ '-c', '<' ] })

# Get the language object from a file name.
exports.getLanguage = (source) -> languages[path.extname(source)]
