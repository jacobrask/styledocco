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
  .describe('tmpl', 'Template directory')
  .describe('out', 'Output directory')
  .alias('o', 'out')
  .default('out', 'docs')
  .argv

inputDir = options._[0] or './'
outputDir = options.out
templateDir = options.tmpl or "#{__dirname}/../resources/"

# Don't strip HTML
marked.setOptions sanitize: false


# Define supported languages
# --------------------------

class Language

  constructor: (@symbols, @preprocessor) ->
    @regexs = {}
    @regexs.single = new RegExp('^\\s*' + @symbols.single) if @symbols.single
    # Hard coded /* */ for now
    @regexs.multi_start = new RegExp(/^[\s]*\/\*/)
    @regexs.multi_end = new RegExp(/\*\//)

  # Check type of string
  checkType: (str) ->
    if str.match(@regexs.multi_start) and str.match(@regexs.multi_end)
      'single'
    else if str.match @regexs.multi_start
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
  path.join path.dirname(file), path.basename(file, path.extname(file)) + '.html'

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
makeSections = (lang, data) ->
  lines = data.split '\n'
  sections = []

  formatDocs = (line) -> "#{lang.filter(line)}\n"
  formatCode = (line) -> "#{line}\n"

  # We loop through the array backwards because `pop` is faster than `splice`.
  while lines.length
    docs = code = ''

    # Since we're looping backwards, first add the code.
    while lines.length and lang.checkType(lines[lines.length-1]) is 'code'
      code = formatCode(lines.pop()) + code

    # Now check for any single line comments.
    while lines.length and lang.checkType(lines[lines.length-1]) is 'single'
      docs = formatDocs(lines.pop()) + docs

    # A multi line comment ends here, add lines until comment start.
    if lines.length and lang.checkType(lines[lines.length-1]) is 'multiend'
      # We want the start line, so `break` *after* line is added.
      while lines.length
        line = lines.pop()
        docs = formatDocs(line) + docs
        break if lang.checkType(line) is 'multistart'

    # Format and save code/doc pair.
    sections.push {
      docs: marked docs.trim()
      code: trimNewLines code
    }

  sections.reverse()


# Render `template` with `content`.
renderTemplate = (templateName, content) ->
  templateFile = "#{templateDir}#{templateName}.jade"

  template = fs.readFileSync templateFile, 'utf-8'
  jade.compile(template, filename: templateFile)(content)


# Generate the HTML document and write to file.
generateSourceHtml = (source, menu, sections) ->
  dest = makeDestination source

  preProcess source, (err, css) ->
    throw err if err?
    data = {
      title: "#{options.name} – #{source}"
      project: {
          name: options.name
          menu
          root: buildRootPath(source) }
      sections
      css
    }

    html = renderTemplate 'docs', data
    console.log "styledocco: #{source} -> #{path.join outputDir, dest}"
    writeFile(dest, html)


# Look for a README file and generate an index.html.
generateIndex = (menu) ->
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
        menu
        root: './' }
    content
  }

  html = renderTemplate 'index', data
  console.log "styledocco: #{files[0] or './'} -> #{path.join outputDir, dest}"
  writeFile dest, html


# Write a file to the filesystem.
writeFile = (dest, contents) ->
  dest = path.join outputDir, dest
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
  filter((source) ->
    return false if source.match /(\/|^)\./ # No hidden files.
    return false if source.match /(\/|^)_.*\.s[ac]ss$/ # No SASS partials.
    return false unless path.extname(source) of languages # Only supported file types.
    return false unless fs.statSync(source).isFile() # Files only.
    return true
  ).sort()

# Make `link` objects for the menu.
menu = {}
for file in files
  link =
    name: path.basename(file, path.extname file)
    href: makeDestination file
  parts = file.split('/').splice(1)
  key =
    if parts.length > 1
      parts[0]
    else
      './'
  if menu[key]?
    menu[key].push link
  else
    menu[key] = [ link ]

# Create `index.html` file.
generateIndex menu

# Generate documentation files.
files.forEach (file) ->
  # Read in stylesheet.
  code = fs.readFileSync file, "utf-8"
  # Parse into code/docs sections.
  sections = makeSections getLanguage(file), code
  # Make HTML.
  generateSourceHtml file, menu, sections

# Add default docs.css unless it already exists.
cssPath = path.join outputDir, 'docs.css'
unless path.existsSync cssPath
  fs.writeFileSync cssPath, fs.readFileSync __dirname + '/../resources/docs.css', 'utf-8'
  console.log "styledocco: adding docs.css"
