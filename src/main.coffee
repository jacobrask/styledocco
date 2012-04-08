fs   = require 'fs'
path = require 'path'
findit   = require 'findit'
jade     = require 'jade'
marked   = require 'marked'
mkdirp   = require 'mkdirp'
optimist = require 'optimist'
langs  = require './languages'
parser = require './parser'
_      = require './utils'

marked.setOptions gfm: on

options = optimist
  .usage('Usage: $0 [options] [INPUT]')
  .describe('name', 'Name of the project').alias('n', 'name').demand('name')
  .describe('out', 'Output directory').alias('o', 'out').default('out', 'docs')
  .describe('resources', 'Directory for static resources').alias('s', 'resources')
    .default('resources', path.resolve(__dirname, '../resources'))
  .describe('preprocessor', 'Custom preprocessor command')
  .argv
options.in = options._[0] or './'

getResourcePath = (fileName) ->
  if path.existsSync path.join options.resources, fileName
    path.join options.resources, fileName
  else
    path.resolve __dirname, path.join '../resources', fileName

templateFile = getResourcePath 'docs.jade'

# Get sections of matching doc/code blocks.
getSections = (filename) ->
  lang = langs.getLanguage filename
  data = fs.readFileSync filename, 'utf-8'
  if lang?
    parser.makeSections parser.extractBlocks lang, data
  else
    parser.makeSections [{ docs: data, code: '' }]

# Generate the HTML document and write to file.
generateFile = (source, data) ->
  if source.match /readme/i
    source = 'index.html'
    dest = _.makeDestination source
    root = './'
  else
    dest = 'html/' + _.makeDestination source
    root = '../'
  data.project = {
    name: options.name
    menu
    root
  }
  render = (data) ->
    template = fs.readFileSync templateFile, 'utf-8'
    html = jade.compile(template, filename: templateFile, pretty: on)(data)
    console.log "styledocco: #{source} -> #{path.join options.out, dest}"
    writeFile dest, html
  if langs.isSupported(source) and options.preprocessor isnt 'none'
    # Run source through suitable CSS preprocessor.
    lang = langs.getLanguage source
    lang.compile source, options.preprocessor, (err, css) ->
      throw err if err?
      data.css = css
      render data
  else
    data.css = ''
    render data

# Write a file to the output dir.
writeFile = (dest, contents) ->
  dest = path.join options.out, dest
  mkdirp.sync path.dirname dest
  fs.writeFileSync dest, contents

# Get all files from input (directory).
sources = findit.sync options.in

# Filter out unsupported file types.
files = sources.
  filter((source) ->
    return false if source.match /(\/|^)\.[^\.]/ # No hidden files.
    return false unless langs.isSupported source # Only supported file types.
    return false unless fs.statSync(source).isFile() # Files only.
    return true
  ).sort()

# Make `link` objects for the menu.
menu = {}
for file in files
  link =
    name: path.basename(file, path.extname file)
    href: 'html/' + _.makeDestination file
  parts = file.split('/').splice(1)
  key = if parts.length > 1 then parts[0] else './'
  if menu[key]?
    menu[key].push link
  else
    menu[key] = [ link ]

# Look for a README file and generate an index.html.
readme = _.findFile(options.in, /^readme/i) \
      or _.findFile(process.cwd(), /^readme/i) \
      or _.findFile(options.resources, /^readme/i) \
      or path.resolve(__dirname, '../resources/README.md')

readmeText =
  if path.extname(readme) is '.md'
    marked fs.readFileSync(readme, 'utf-8')
  else
    fs.readFileSync(readme, 'utf-8')
sections = [ docs: readmeText ]
generateFile readme, { menu, sections, title: '', description: '' }

# Generate documentation files.
files.forEach (file) ->
  sections = getSections file
  generateFile file, { menu, sections, title: file, description: '' }

# Write static files to output directory.
writeStaticFile = (fileName) ->
  outPath = path.join options.out, fileName
  fs.writeFileSync outPath, fs.readFileSync getResourcePath(fileName), 'utf-8'
  console.log "styledocco: writing #{outPath}"

writeStaticFile 'docs.css'
writeStaticFile 'docs.js'
