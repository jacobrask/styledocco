# Dependencies
# ============

{exec} = require 'child_process'
fs     = require 'fs'
path   = require 'path'

marked   = require 'marked'
mkdirp   = require 'mkdirp'
findit   = require 'findit'
jade     = require 'jade'
optimist = require 'optimist'


# Configuration
# =============

options = optimist
  .usage('Usage: $0 [options] [INPUT]')
  .describe('name', 'Name of the project')
  .alias('n', 'name')
  .demand('name')
  .describe('out', 'Output directory')
  .alias('o', 'out')
  .default('out', 'docs')
  .argv

inputDir = options._[0] or './'
outputDir = options.out

# Don't strip HTML
marked.setOptions sanitize: false


# Define supported languages

class Language

  constructor: (@symbols, @preprocessor) ->
    @regexs = {}
    @regexs.single = new RegExp('^\\s*' + @symbols.single + '\\s?') if @symbols.single
    # Hard coded /* */ for now
    @regexs.multi_start = new RegExp(/^[\s]*\/\*[.]*/)
    @regexs.multi_end = new RegExp(/.*\*\/.*/)

  # Check type of string
  checkType: (str) ->
    if str.match @regexs.multi_start
      'multistart'
    else if str.match @regexs.multi_end
      'multiend'
    else if @regexs.single? and str.match @regexs.single
      'single'
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


# A list of the supported stylesheet languages and their comment symbols
# and optional preprocessor command.
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


# Helper functions and utilities
# ==============================

# Get the language object from a file name.
getLanguage = (source) -> languages[path.extname(source)]

# Trim newlines from beginning and end of string.
trimNewLines = (str) -> str.replace(/^\n*/, '').replace(/\n*$/, '')

# Compute the destination HTML path for an input source file path,
# relative to the output directory.
makeDestination = (file) ->
  [ path.dirname(file)
    '/'
    path.basename file, path.extname file
    '.html' ].join ''

# Build a path to the documentation root.
buildRootPath = (str) ->
  if path.dirname(str) is '.'
    root = path.dirname(str)
  else
    root = path.dirname(str).replace(/[^\/]+/g, '..')
  root += '/' unless root.slice(-1) is '/'
  root

# Run `filename` through suitable CSS preprocessor.
preProcess = (filename, cb) ->
  lang = getLanguage filename
  lang.compile filename, cb


# Given a string of source code, find each comment and the code that
# follows it, and create an individual **section** for the code/doc pair.
#
# This stuff comes straight from docco(-husky).
makeSections = (lang, data) ->
  
  lines = data.split '\n'
  
  sections = []
  docs = code = multiAccum = ''
  inMulti = no
  hasCode = no

  save = (docs, code) ->
    sections.push
      docs: marked trimNewLines(docs)
      code: trimNewLines(code)

  for line in lines

    # Multi line comment
    if lang.checkType(line) is 'multistart' or inMulti

      ## Start of a new section, save the old section
      if hasCode
        save docs, code
        docs = code = ''
        hasCode = no

      # Found the start of a multiline comment.
      # Begin accumulating lines until we reach the end of the comment block.
      inMulti = yes
      multiAccum += line + '\n'

      # If we reached the end of a multiline comment,
      # set inMulti to false and reset multiAccum
      if lang.checkType(line) is 'multiend'
        inMulti = no
        docs = multiAccum
        multiAccum = ''

    # Single line comment
    else if lang.checkType(line) is 'single'
      if hasCode
        hasCode = no
        save docs, code
        docs = code = ''
      docs += lang.filter(line) + '\n'

    # Code
    else
      hasCode = yes
      code += line + '\n'

  # Save final code section
  save docs, code

  sections


# Render `template` with `content`.
renderTemplate = (templateName, content) ->
  templateDir = "#{__dirname}/../resources/"
  templateFile = "#{templateDir}#{templateName}.jade"

  template = fs.readFileSync templateFile, 'utf-8'
  jade.compile(template, filename: templateFile)(content)


# Generate the HTML document and write to file.
generateSourceHtml = (source, links, sections) ->
  dest = makeDestination source

  links = links.map (link) ->
    link.class = 'is-active' if link.path is source
    link


  preProcess source, (err, css) ->
    throw err if err?
    data = {
      title: "#{options.name} – #{source}"
      project: {
          name: options.name
          links
          root: buildRootPath(source) }
      sections
      css
    }

    html = renderTemplate 'docs', data
    console.log "styledocco: #{source} -> #{outputDir}/#{dest}"
    writeFile(dest, html)


# Look for a README file and generate an index.html.
generateIndex = (links) ->
  currentDir = "#{process.cwd()}/"
  dest = "index.html"

  # Look for readme in current dir
  files = fs.readdirSync(currentDir)
    .filter (file) -> file.toLowerCase().match /^readme/

  content =
    if files[0]?
      # Parse Readme with markdown.
      marked fs.readFileSync currentDir + files[0], 'utf-8'
    else
      "<h1>Readme</h1><p>Please add a README file to this project.</p>"

  data = {
    title: options.name
    project: {
        name: options.name
        links
        root: './' }
    content
  }

  html = renderTemplate 'readme', data
  console.log "styledocco: #{files[0] or './'} -> #{outputDir}/#{dest}"
  writeFile dest, html


# Write a file to the filesystem.
writeFile = (dest, contents) ->
  dest = "#{outputDir}/#{dest}"
  mkdirp.sync path.dirname dest
  fs.writeFileSync dest, contents


# Program flow starts here.
# =========================

# Make sure that specified output directory exists.
mkdirp.sync outputDir

# Get all files from input directory.
sources = findit.sync inputDir

# Filter out only our supported file types.
files = sources.
  filter (source) ->
    return false if source.match /(\/|^)\./ # No hidden files.
    return false if source.match /(\/|^)_.*\.s[ac]ss$/ # No SASS partials.
    return false unless path.extname(source) of languages # Only supported file types.
    return false unless fs.statSync(source).isFile() # Files only.
    return true

# Make `link` objects for the menu.
links = files
  .sort()
  .map (file) ->
    name: path.basename file, path.extname file
    path: file
    href: makeDestination file
    class: null

# Create `index.html` file.
generateIndex links

files.forEach (file) ->
  # Read in stylesheet.
  code = fs.readFileSync file, "utf-8"
  # Parse into code/docs sections.
  sections = makeSections getLanguage(file), code
  # Make HTML.
  generateSourceHtml file, links, sections
