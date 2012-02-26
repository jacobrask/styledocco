# Dependencies
# ============

{exec} = require 'child_process'
fs     = require 'fs'
path   = require 'path'

marked = require 'marked'
jade   = require 'jade'
walk   = require 'walk'


# Configuration
# =============

marked.setOptions sanitize: false


# Generate the documentation for a source file by reading it in, splitting it
# up into comment/code sections, and passing them to a Jade template.
generateDocumentation = (sourceFile, context, cb) ->
  fs.readFile sourceFile, "utf-8", (err, code) ->
    throw err if err
    sections = makeSections getLanguage(sourceFile), code
    generateSourceHtml sourceFile, context, sections
    cb()


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
      exec "#{@preprocessor.cmd} #{@preprocessor.args.join(' ')} #{filename}", (err, stdout, stderr) ->
        cb err, stdout
    else
      fs.readFile filename, 'utf-8', (err, data) ->
        cb err, data

# A list of the supported stylesheet languages and their comment symbols
# and optional preprocessor command.
languages =
  '.css':  new Language({ multi: [ "/*", "*/" ] })
  '.scss': new Language({ single: '//', multi: [ "/*", "*/" ] }, { cmd: 'scss', args: [ '-t', 'compressed' ] })
  '.sass': new Language({ single: '//', multi: [ "/*", "*/" ] }, { cmd: 'scss', args: [ '-t', 'compressed' ] })
  '.less': new Language({ single: '//', multi: [ "/*", "*/" ] }, { cmd: 'lessc', args: [ '-x' ] })
  '.styl': new Language({ single: '//', multi: [ "/*", "*/" ] }, { cmd: 'stylus', args: [ '-c', '<' ] })



# Given a string of source code, find each comment and the code that
# follows it, and create an individual **section** for the code/doc pair.
makeSections = (lang, data) ->
  
  lines = data.split '\n'
  
  sections = []
  docs = code = multiAccum = ''
  inMulti = no
  hasCode = no

  for line in lines

    # Multi line comment
    if lang.checkType(line) is 'multistart' or inMulti

      ## Start of a new section, save the old section
      if hasCode
        sections.push { docs: marked(docs), code }
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
        sections.push { docs: marked(docs), code }
        docs = code = ''
      docs += lang.filter(line) + '\n'

    # Code
    else
      hasCode = yes
      code += line + '\n'

  # Save final code section
  sections.push { docs: marked(docs), code }

  sections

# Run `filename` through suitable preprocessor.
preProcess = (filename, cb) ->
  lang = getLanguage filename
  lang.compile filename, cb

# Once all of the code is finished highlighting, we can generate the HTML file
# and write out the documentation. Pass the completed sections into the template
# found in `resources/docs.jade`
generateSourceHtml = (source, context, sections) ->
  title = path.basename source
  dest  = destination source, context

  preProcess source, (err, css) ->
    throw err if err
    html  = docco_template {
      title, file_path: source, sections, context, path, relative_base, css
    }
    console.log "styledocco: #{source} -> #{dest}"
    writeFile(dest, html)

generateReadme = (context, sources) ->
  title = "README"
  dest = "#{context.config.output_dir}/index.html"
  source = "README.md"

  # README.md template to be use to generate the main README file
  readme_template  = jade.compile fs.readFileSync(__dirname + '/../resources/readme.jade').toString(), { filename: __dirname + '/../resources/readme.jade' }
  readme_path = "#{process.cwd()}/#{source}"
 
  # Parse the Markdown in the Readme
  content = marked fs.readFileSync(readme_path).toString() or "There is no readme for this project yet."
  
  html = readme_template { title, context, content, file_path: source, path, relative_base }
  
  console.log "styledocco: #{source} -> #{dest}"
  writeFile(dest, html)

# Write a file to the filesystem
writeFile = (dest, contents) ->

    target_dir = path.dirname(dest)
    write_func = ->
      fs.writeFile dest, contents, (err) -> throw err if err

    fs.stat target_dir, (err, stats) ->
      throw err if err and err.code != 'ENOENT'

      return write_func() unless err

      if err
        exec "mkdir -p #{target_dir}", (err) ->
          throw err if err
          write_func()

# Get the current language we're documenting, based on the extension.
getLanguage = (source) -> languages[path.extname(source)]

# Compute the path of a source file relative to the docs folder
relative_base = (filepath, context) ->
  result = path.dirname(filepath) + '/'
  if result == '/' or result == '//' then '' else result

# Compute the destination HTML path for an input source file path. If the source
# is `lib/example.coffee`, the HTML will be at `docs/example.html`.
destination = (filepath, context) ->
  base_path = relative_base filepath, context
  "#{context.config.output_dir}/" + base_path + path.basename(filepath, path.extname(filepath)) + '.html'

# Ensure that the destination directory exists.
ensureDirectory = (dir, cb) ->
  exec "mkdir -p #{dir}", -> cb()

file_exists = (path) ->
  try
    return fs.lstatSync(path).isFile
  catch ex
    return false

# Create the template that we will use to generate the Styledocco HTML page.
docco_template = jade.compile fs.readFileSync(__dirname + '/../resources/docs.jade').toString(), { filename: __dirname + '/../resources/docs.jade' }

# Process our arguments, passing an array of sources to generate docs for,
# and an optional relative root.
parseArgs = (cb) ->

  args = process.ARGV
  project_name = ""

  # Optional Project name following -name option
  if args[0] == "-name"
    args.shift()
    project_name = args.shift()

  # Sort the list of files and directories
  args = args.sort()

  # Preserving past behavior: if no args are given, we do nothing (eventually
  # display help?)
  return unless args.length

  # Collect all of the directories or file paths to then pass onto the 'find'
  # command
  roots = (a.replace(/\/+$/, '') for a in args)
  roots = roots.join(" ")
    
  # Only include files that we know how to handle
  lang_filter = for ext of languages
    " -name '*#{ext}' "
  lang_filter = lang_filter.join ' -o '

  # Rather than deal with building a recursive tree walker via the fs module,
  # let's save ourselves typing and testing and drop to the shell
  exec "find #{roots} -type f \\( #{lang_filter} \\)", (err, stdout) ->
    throw err if err

    sources = stdout.split("\n").filter (file) ->
      return false if file is ''
      filename = path.basename file
      # Ignore hidden files
      return false if filename[0] is '.'
      # Ignore SASS partials
      return false if filename.match /^_.*\.s[ac]ss$/
      true

    console.log "styledocco: Recursively generating docs underneath #{roots}/"

    cb sources, project_name, args

parseArgs (sources, project_name, raw_paths) ->
  # Rather than relying on globals, let's pass around a context w/ misc info
  # that we require down the line.
  context = {
    sources
    options: { project_name }
  }
  context.config = {
    show_timestamp: yes
    output_dir: 'docs'
    project_name: project_name or ''
  }

  ensureDirectory context.config.output_dir, ->
    generateReadme(context, raw_paths)
    files = sources[0..sources.length]
    nextFile = ->
      if files.length
        generateDocumentation files.shift(), context, nextFile
    nextFile()
