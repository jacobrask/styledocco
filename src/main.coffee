# Dependencies
# ============

fs   = require 'fs'
path = require 'path'

highlight = require 'highlight.js'
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

currentDir = "#{process.cwd()}/"
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
generateSourceHtml = (source, menu, sections, title, description) ->

  dest = makeDestination source

  render = ->
    html = renderTemplate 'docs', data
    console.log "styledocco: #{source} -> #{path.join outputDir, dest}"
    writeFile(dest, html)

  data = {
    title
    description
    project: {
      name: options.name
      menu
      root: buildRootPath(source) }
    sections
    css: ''
  }

  if langs.isSupported source
    preProcess source, (err, css) ->
      throw err if err?
      data.css = css
      render()
  else
    render()


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
    return false unless langs.isSupported source # Only supported file types.
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

# Look for a README file and generate an index.html.
findFile = (dir, re) ->
  return null unless fs.statSync(dir).isDirectory()
  fs.readdirSync(dir).filter((file) -> file.match re)?[0]

# Look for readme, fall back to default.
readme = findFile(input, /^readme/i) or findFile(currentDir, /^readme/i) or findFile(templateDir, /^readme/i)

tokens = parser.getDocTokens readme

# Check if first token looks like a page title. If it does, check if next token
# looks like a description.
title = parser.getTitle tokens
if title?
  tokens.shift()
  description = parser.getDescription tokens
  tokens.shift() if description?
else
  title = options.name

generateSourceHtml(
  readme
  menu
  parser.makeSections(
    tokens
  ).map (section) -> marked.parser(section)
  title
  description
)

# Generate documentation files.
files.forEach (file) ->

  # Gets marked markdown tokens from `file`.
  tokens = parser.getDocTokens file

  # Check if first token looks like a page title. If it does, check if
  # next token looks like a description.
  title = parser.getTitle tokens
  if title?
    tokens.shift()
    description = parser.getDescription tokens
    tokens.shift() if description?
  else
    title = path.basename(file, path.extname file)

  origTokens = tokens.slice(0)

  # For each code block we encounter, add an example box.
  for token, i in origTokens when token.type is 'code'
    diff = tokens.length - origTokens.length
    newToken = {
      type: 'html'
      pre: false
      text: "<div class=\"styledocco-example\">#{token.text}</div>"
    }
    tokens.splice(i + diff, 0, newToken)
  
  for token, i in tokens when token.type is 'code'
    token.text = highlight.highlightAuto(token.text).value
    token.escaped = true

  sections = parser.makeSections(tokens).map (section) ->
    marked.parser section

  # Make HTML.
  generateSourceHtml file, menu, sections, title, description

# Add default docs.css unless it already exists.
cssPath = path.join outputDir, 'docs.css'
if overwriteResources or not path.existsSync cssPath
  fs.writeFileSync cssPath, fs.readFileSync __dirname + '/../resources/docs.css', 'utf-8'
  console.log "styledocco: writing #{path.join outputDir, 'docs.css'}"
