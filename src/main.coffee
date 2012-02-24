# Generate the documentation for a source file by reading it in, splitting it
# up into comment/code sections, highlighting them for the appropriate language,
# and merging them into an HTML template.
generateDocumentation = (source, context, callback) ->
  fs.readFile source, "utf-8", (error, code) ->
    throw error if error
    sections = parse source, code
    highlight source, sections, ->
      generate_source_html source, context, sections
      callback()

# Given a string of source code, parse out each comment and the code that
# follows it, and create an individual **section** for it.
# Sections take the form:
#
#     {
#       docs_text: ...
#       docs_html: ...
#       code_text: ...
#       code_html: ...
#     }
#
parse = (source, code) ->
  lines    = code.split '\n'
  sections = []
  language = get_language source
  has_code = docs_text = code_text = ''

  in_multi = false
  multi_accum = ""

  save = (docs, code) ->
    sections.push docs_text: docs, code_text: code
  for line in lines
    if line.match(language.multi_start_matcher) or in_multi

      if has_code
        save docs_text, code_text
        has_code = docs_text = code_text = ''

      # Found the start of a multiline comment line, set in_multi to true
      # and begin accumulating lines untime we reach a line that finishes
      # the multiline comment
      in_multi = true
      multi_accum += line + '\n'

      # If we reached the end of a multiline comment, template the result
      # and set in_multi to false, reset multi_accum
      if line.match(language.multi_end_matcher)
        in_multi = false
        try
          parsed = dox.parseComments( multi_accum )[0]
          docs_text += dox_template(parsed)
        catch error
          console.log "Error parsing comments with Dox: #{error}"
          docs_text = multi_accum
        multi_accum = ''

    else if line.match(language.comment_matcher) and not line.match(language.comment_filter)
      if has_code
        save docs_text, code_text
        has_code = docs_text = code_text = ''
      docs_text += line.replace(language.comment_matcher, '') + '\n'
    else
      has_code = yes
      code_text += line + '\n'
  save docs_text, code_text
  sections

# Highlights a single chunk of CoffeeScript code, using **Pygments** over stdio,
# and runs the text of its corresponding comment through **Markdown**, using
# [Showdown.js](http://attacklab.net/showdown/).
#
# We process the entire file in a single call to Pygments by inserting little
# marker comments between each section and then splitting the result string
# wherever our markers occur.
highlight = (source, sections, callback) ->
  for section, i in sections
    section.code_html = highlight_start + section.code_text + highlight_end
    section.docs_html = showdown.makeHtml section.docs_text
  callback()
   
# Once all of the code is finished highlighting, we can generate the HTML file
# and write out the documentation. Pass the completed sections into the template
# found in `resources/docco.jst`
generate_source_html = (source, context, sections) ->
  title = path.basename source
  dest  = destination source, context
  html  = docco_template {
    title: title, file_path: source, sections: sections, context: context, path: path, relative_base: relative_base
  }

  console.log "docco: #{source} -> #{dest}"
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
  
  # run cloc 
  cloc sources.join(" "), (code_stats) ->

    html = readme_template {
      title: title
      context: context
      content: content
      content_index: content_index
      file_path: source
      path: path
      relative_base: relative_base
      package_json: package_json
      code_stats: code_stats
      gravatar: gravatar
    }
    
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
        title: fileStats.name, context: context, content: html, file_path: fileStats.name, path: path, relative_base: relative_base
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
  markdown = fs.readFileSync(src).toString()
  return showdown.makeHtml markdown

cloc = (paths, callback) ->
  exec "#{__dirname}/../vendor/cloc.pl --quiet --read-lang-def=#{__dirname}/../resources/cloc_definitions.txt #{paths}", (err, stdout) ->
    console.log "Calculating project stats failed #{err}" if err
    callback stdout

#### Helpers & Setup

# Require our external dependencies, including **Showdown.js**
# (the JavaScript implementation of Markdown).
fs       = require 'fs'
path     = require 'path'
showdown = require('./../vendor/showdown').Showdown
jade     = require 'jade'
dox      = require 'dox'
gravatar = require 'gravatar'
_        = require 'underscore'
walk     = require 'walk'
{spawn, exec} = require 'child_process'

# A list of the languages that Docco supports, mapping the file extension to
# the name of the Pygments lexer and the symbol that indicates a comment. To
# add another language to Docco's repertoire, add it here.
languages =
  '.css':
    name: 'css', symbol: '//', multi_start: "/*", multi_end: "*/"
  '.scss':
    name: 'scss', symbol: '//', multi_start: "/*", multi_end: "*/"
  '.less':
    name: 'less', symbol: '//', multi_start: "/*", multi_end: "*/"

# Build out the appropriate matchers and delimiters for each language.
for ext, l of languages

  # Does the line begin with a comment?
  l.comment_matcher = new RegExp('^\\s*' + l.symbol + '\\s?')

  # Ignore [hashbangs](http://en.wikipedia.org/wiki/Shebang_(Unix))
  # and interpolations...
  l.comment_filter = new RegExp('(^#![/]|^\\s*#\\{)')

  # The dividing token we feed into Pygments, to delimit the boundaries between
  # sections.
  l.divider_text = '\n' + l.symbol + 'DIVIDER\n'

  # The mirror of `divider_text` that we expect Pygments to return. We can split
  # on this to recover the original sections.
  # Note: the class is "c" for Python and "c1" for the other languages
  l.divider_html = new RegExp('\\n*<span class="c1?">' + l.symbol + 'DIVIDER<\\/span>\\n*')

  # Since we'll only handle /* */ multilin comments for now, test for them explicitly
  # Otherwise set the multi matchers to an unmatchable RegEx
  if l.multi_start == "/*"
    l.multi_start_matcher = new RegExp(/^[\s]*\/\*[.]*/)
  else
    l.multi_start_matcher = new RegExp(/a^/)
  if l.multi_end == "*/"
    l.multi_end_matcher = new RegExp(/.*\*\/.*/)
  else
    l.multi_end_matcher = new RegExp(/a^/)


# Get the current language we're documenting, based on the extension.
get_language = (source) -> languages[path.extname(source)]

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

dox_template = jade.compile fs.readFileSync(__dirname + '/../resources/dox.jade').toString(), { filename: __dirname + '/../resources/dox.jade' }

content_template = jade.compile fs.readFileSync(__dirname + '/../resources/content.jade').toString(), { filename: __dirname + '/../resources/content.jade' }

# The CSS styles we'd like to apply to the documentation.
docco_styles    = fs.readFileSync(__dirname + '/../resources/docco.css').toString()

# The start of each Pygments highlight block.
highlight_start = '<pre><code>'

# The end of each Pygments highlight block.
highlight_end   = '</code></pre>'

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
    console.log "docco: Recursively generating docs underneath #{roots}/"

    callback(sources, project_name, args)

check_config = (context,pkg)->
  defaults = {
    # the primary CSS file to load
    css: (__dirname + '/../resources/docco.css')

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
  context.config = _.extend(defaults, pkg.docco_husky || {})

parse_args (sources, project_name, raw_paths) ->
  # Rather than relying on globals, let's pass around a context w/ misc info
  # that we require down the line.
  context = sources: sources, options: { project_name: project_name }
  
  package_path = process.cwd() + '/package.json'
  try
    package_json = if file_exists(package_path) then JSON.parse(fs.readFileSync(package_path).toString()) else {}
  catch err
    console.log "Error parsing package.json"
    console.log err

  check_config(context, package_json)

  ensure_directory context.config.output_dir, ->
    generate_readme(context, raw_paths,package_json)
    fs.writeFile "#{context.config.output_dir}/docco.css", fs.readFileSync(context.config.css).toString()
    files = sources[0..sources.length]
    next_file = -> generateDocumentation files.shift(), context, next_file if files.length
    next_file()
    if context.config.content_dir then generate_content context, context.config.content_dir
