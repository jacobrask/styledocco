# Dependencies
# ============

{ exec } = require 'child_process'
fs   = require 'fs'
path = require 'path'

marked = require 'marked'
jade   = require 'jade'
_      = require 'underscore'
walk   = require 'walk'


# Configuration
# =============

marked.setOptions sanitize: false


# Generate the documentation for a source file by reading it in, splitting it
# up into comment/code sections, and merging them into an HTML template.
generateDocumentation = (sourceFile, context, cb) ->
  fs.readFile sourceFile, "utf-8", (err, code) ->
    throw err if err
    sections = makeSections getLanguage(sourceFile), code
    generate_source_html sourceFile, context, sections
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


# A list of the supported stylesheet languages and their comment symbols
# and optional preprocessor command.
languages =
  '.css':  new Language { multi: [ "/*", "*/" ] }
  '.scss': new Language { single: '//', multi: [ "/*", "*/" ] }, 'scss'
  '.sass': new Language { single: '//', multi: [ "/*", "*/" ] }, 'sass'
  '.less': new Language { single: '//', multi: [ "/*", "*/" ] }, 'less'
  '.styl': new Language { single: '//', multi: [ "/*", "*/" ] }, 'stylus'



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
   
# Once all of the code is finished highlighting, we can generate the HTML file
# and write out the documentation. Pass the completed sections into the template
# found in `resources/docco.jst`
generate_source_html = (source, context, sections) ->
  title = path.basename source
  css = fs.readFileSync(source).toString()
  dest  = destination source, context
  html  = docco_template {
    title, file_path: source, sections, context, path, relative_base, css
  }

  console.log "styledocco: #{source} -> #{dest}"
  write_file(dest, html)

generate_readme = (context, sources, package_json) ->
  title = "README"
  dest = "#{context.config.output_dir}/index.html"
  source = "README.md"

  # README.md template to be use to generate the main README file
  readme_template  = jade.compile fs.readFileSync(__dirname + '/../resources/readme.jade').toString(), { filename: __dirname + '/../resources/readme.jade' }
  readme_path = "#{process.cwd()}/#{source}"
  content_index_path = "#{process.cwd()}/#{context.config.content_dir}/content_index.md"
  
  # generate the content index if it exists under the content sources
  if file_exists(content_index_path)
    content_index = parse_markdown context, content_index_path
  else
    content_index = ""
 
  # parse the markdown the the readme 
  content = parse_markdown(context, readme_path) || "There is no #{source} for this project yet :( "
  
  html = readme_template { title, context, content, content_index, file_path: source, path, relative_base }
  
  console.log "docco: #{source} -> #{dest}"
  write_file(dest, html)

generate_content = (context, dir) ->
  walker = walk.walk(dir, { followLinks: false })
  walker.on 'file', (root, fileStats, next) ->
    # only match files that end in *.md
    if fileStats.name.match(new RegExp ".md$")
      src = "#{root}/#{fileStats.name}"
      dest  = destination(src.replace(context.config.content_dir, ""), context)
      console.log "markdown: #{src} --> #{dest}"
      html = parse_markdown context, src
      html = content_template {
        title: fileStats.name, context, content: html, file_path: fileStats.name, path, relative_base
      }
      write_file dest, html
    next()

# Write a file to the filesystem
write_file = (dest, contents) ->

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


# Parse a markdown file and return the HTML 
parse_markdown = (context, src) ->
  data = fs.readFileSync(src).toString()
  return marked data

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
ensure_directory = (dir, callback) ->
  exec "mkdir -p #{dir}", -> callback()

file_exists = (path) ->
  try
    return fs.lstatSync(path).isFile
  catch ex
    return false

# Create the template that we will use to generate the Docco HTML page.
docco_template  = jade.compile fs.readFileSync(__dirname + '/../resources/docco.jade').toString(), { filename: __dirname + '/../resources/docco.jade' }

content_template = jade.compile fs.readFileSync(__dirname + '/../resources/content.jade').toString(), { filename: __dirname + '/../resources/content.jade' }

# Process our arguments, passing an array of sources to generate docs for,
# and an optional relative root.
parse_args = (callback) ->

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

    # Don't include hidden files, either
    sources = stdout.split("\n").filter (file) -> file != '' and path.basename(file)[0] != '.'
    console.log "styledocco: Recursively generating docs underneath #{roots}/"

    callback(sources, project_name, args)

check_config = (context)->
  defaults = {
    # show the timestamp on generated docs
    show_timestamp: true,

    # output directory for generated docs
    output_dir: "docs",

    # the projectname
    project_name: context.options.project_name || '',

    # source directory for any additional markdown documents including a
    # index.md that will be included in the main generated page
    content_dir: null
  }
  context.config = _.extend(defaults)

parse_args (sources, project_name, raw_paths) ->
  # Rather than relying on globals, let's pass around a context w/ misc info
  # that we require down the line.
  context = sources: sources, options: { project_name: project_name }
  

  check_config(context)

  ensure_directory context.config.output_dir, ->
    generate_readme(context, raw_paths)
    files = sources[0..sources.length]
    next_file = -> generateDocumentation files.shift(), context, next_file if files.length
    next_file()
    if context.config.content_dir then generate_content context, context.config.content_dir
