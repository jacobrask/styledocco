# Dependencies
# ============

fs   = require 'fs'
path = require 'path'

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


# Get sections of Markdown tokens (from comments), and matching code blocks.
getSections = (filename) ->
  data = fs.readFileSync filename, "utf-8"
  lang = langs.getLanguage filename
  if lang?
    blocks = parser.extractBlocks lang, data
    sections = parser.makeSections blocks
  else
    sections = parser.makeSections [ { docs: data, code: '' } ]
  sections

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
generateSourceHtml = (source, data) ->

  dest = makeDestination source.replace /readme/i, 'index'

  data.project = {
    name: options.name
    menu
    root: buildRootPath source.replace /readme/i, 'index'
  }

  render = (data) ->
    html = renderTemplate 'docs', data
    console.log "styledocco: #{source} -> #{path.join outputDir, dest}"
    writeFile(dest, html)


  if langs.isSupported source
    preProcess source, (err, css) ->
      throw err if err?
      data.css = css
      render data
  else
    data.css = ''
    render data


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
readme = findFile(input, /^readme/i) \
      or findFile(currentDir, /^readme/i) \
      or findFile(templateDir, /^readme/i)

sections = getSections readme

generateSourceHtml readme, { menu, sections, title: '', description: '' }

# Generate documentation files.
files.forEach (file) ->
  sections = getSections file
  generateSourceHtml file, { menu, sections, title: '', description: '' }

# Add default docs.css unless it already exists.
cssPath = path.join outputDir, 'docs.css'
if overwriteResources or not path.existsSync cssPath
  fs.writeFileSync cssPath, fs.readFileSync __dirname + '/../resources/docs.css', 'utf-8'
  console.log "styledocco: writing #{path.join outputDir, 'docs.css'}"
