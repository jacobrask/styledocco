# Dependencies
# ============

fs   = require 'fs'
path = require 'path'

marked   = require 'marked'
mkdirp   = require 'mkdirp'
findit   = require 'findit'
jade     = require 'jade'
optimist = require 'optimist'

langs  = require './languages'
parser = require './parser'
_ = require './utils'

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
  .describe('tmpl', 'Template directory')
  .boolean('overwrite')
  .describe('overwrite', 'Overwrite existing files in target dir')
  .argv

input = options._[0] or './'
outputDir = options.out
templateDir = options.tmpl or "#{__dirname}/../resources/"
overwriteResources = options.overwrite

# Don't strip HTML
marked.setOptions
  sanitize: no
  gfm: on

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
  lang = langs.getLanguage filename
  lang.compile filename, cb


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

  # Look for readme in input dir
  if fs.statSync(input).isDirectory()
    files = fs.readdirSync(input)
      .filter (file) -> file.toLowerCase().match /^readme/
    if files[0]?
      readme = path.join input, files[0]

  unless readme?
    # Look for readme in current dir
    files = fs.readdirSync(currentDir)
      .filter (file) -> file.toLowerCase().match /^readme/
    if files[0]?
      readme = path.join currentDir, files[0]

  content =
    if readme?
      # Parse Readme with markdown.
      marked fs.readFileSync readme, 'utf-8'
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

# Get all files from input (directory).
sources = findit.sync input

# Filter out only our supported file types.
files = sources.
  filter((source) ->
    return false if source.match /(\/|^)\./ # No hidden files.
    return false unless langs.isSupported(source) # Only supported file types.
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
  tokens = marked.lexer parser.getDocs langs.getLanguage(file), code

  # Split docs into sections after headings.
  sections = []
  while tokens.length
    if tokens[0].type is 'heading' and tokens[0].depth <= 2
      # Save section.
      if section?.length
        sections.push marked.parser section
      # Start again on new section.
      section = [ tokens.shift() ]
    else
      (section?=[]).push tokens.shift()
      if tokens.length is 1
        sections.push marked.parser section

  # Make HTML.
  generateSourceHtml file, menu, sections

# Add default docs.css unless it already exists.
cssPath = path.join outputDir, 'docs.css'
if overwriteResources or not path.existsSync(cssPath)
  fs.writeFileSync cssPath, fs.readFileSync __dirname + '/../resources/docs.css', 'utf-8'
  console.log "styledocco: writing #{path.join outputDir, 'docs.css'}"
