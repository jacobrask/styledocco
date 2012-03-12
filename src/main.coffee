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
  .describe('name', 'Name of the project').alias('n', 'name').demand('name')
  .describe('out', 'Output directory').alias('o', 'out').default('out', 'docs')
  .describe('tmpl', 'Template directory').default('tmpl', "#{__dirname}/../resources/")
  .describe('overwrite', 'Overwrite existing files in target dir').boolean('overwrite')
  .argv

options.in = options._[0] or './'

# Get sections of matching doc/code blocks.
getSections = (filename) ->
  data = fs.readFileSync filename, "utf-8"
  lang = langs.getLanguage filename
  if lang?
    blocks = parser.extractBlocks lang, data
    sections = parser.makeSections blocks
  else
    sections = parser.makeSections [ { docs: data, code: '' } ]
  sections

findFile = (dir, re) ->
  return null unless fs.statSync(dir).isDirectory()
  fs.readdirSync(dir).filter((file) -> file.match re)?[0]


# Generate the HTML document and write to file.
generateFile = (source, data) ->

  dest = _.makeDestination source.replace /readme/i, 'index'
  data.project = {
    name: options.name
    menu
    root: _.buildRootPath source.replace /readme/i, 'index'
  }

  render = (data) ->
    templateFile = path.join options.tmpl, 'docs.jade'
    template = fs.readFileSync templateFile, 'utf-8'
    html = jade.compile(template, filename: templateFile)(data)
    console.log "styledocco: #{source} -> #{path.join options.out, dest}"
    writeFile dest, html

  if langs.isSupported source
    # Run source through suitable CSS preprocessor.
    lang = langs.getLanguage source
    lang.compile source, (err, css) ->
      throw err if err?
      data.css = css
      render data
  else
    data.css = ''
    render data


# Write a file to the filesystem.
writeFile = (dest, contents) ->
  dest = path.join options.out, dest
  mkdirp.sync path.dirname dest
  fs.writeFileSync dest, contents


# Program flow starts here.
# =========================

# Make sure that specified output directory exists.
mkdirp.sync options.out

# Get all files from input (directory).
sources = findit.sync options.in

# Filter out unsupported file types.
files = sources.
  filter((source) ->
    return false if source.match /(\/|^)\./ # No hidden files.
    return false if source.match /(\/|^)_.*\.s[ac]ss$/ # No SASS partials.
    return false unless langs.isSupported source # Only supported file types.
    return false unless fs.statSync(source).isFile() # Files only.
    return true
  ).sort()

# Make `link` objects for the menu.
menu = {}
for file in files
  link =
    name: path.basename(file, path.extname file)
    href: _.makeDestination file
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
readme = findFile(options.in, /^readme/i) \
      or findFile(process.cwd(), /^readme/i) \
      or findFile(options.tmpl, /^readme/i)

sections = getSections readme

generateFile readme, { menu, sections, title: '', description: '' }

# Generate documentation files.
files.forEach (file) ->
  sections = getSections file
  generateFile file, { menu, sections, title: file, description: '' }

# Add default docs.css unless it already exists.
cssPath = path.join options.out, 'docs.css'
if options.overwrite or not path.existsSync cssPath
  fs.writeFileSync cssPath, fs.readFileSync __dirname + '/../resources/docs.css', 'utf-8'
  console.log "styledocco: writing #{path.join options.out, 'docs.css'}"
