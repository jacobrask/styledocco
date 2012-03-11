# # Dependencies and configuration.

fs     = require 'fs'
highlight = require 'highlight.js'
marked = require 'marked'
_      = require './utils'

marked.setOptions sanitize: no, gfm: on


# # Public functions.

# # Internal functions.

# Extract comments and code in matching blocks. Each continous block of
# comments is matched with the code that follows it, until the next comment
# block starts.
extractBlocks = exports.extractBlocks = (lang, data) ->
  lines = data.split '\n'
  sections = []

  formatCode = (line) -> "#{line}\n"
  formatDocs = (line) -> "#{lang.filter(line)}\n"

  while lines.length
    docs = code = ''
    
    # First check for any single line comments.
    while lines.length and lang.checkType(lines[0]) is 'single'
      docs += formatDocs lines.shift()

    # A multi line comment starts here, add lines until comment ends.
    if lines.length and lang.checkType(lines[0]) is 'multistart'
      # We want the end line, so `break` *after* line is added.
      while lines.length
        line = lines.shift()
        docs += formatDocs line
        break if lang.checkType(line) is 'multiend'

    while lines.length and \
    (lang.checkType(lines[0]) is 'code' or lang.checkType(lines[0]) is 'multiend')
      code += formatCode lines.shift()
  
    sections.push { docs, code }
  sections


makeSections = exports.makeSections = (blocks) ->
  blocks
    # Run comments through marked.lexer to get Markdown tokens.
    .map((block) ->
      docs: marked.lexer block.docs
      code: highlight.highlight('css', block.code).value
    )
    .map(addDocExamples, [])
    .reduce(splitter, [])
    .map(parser)

# If we encounter code blocks in documentation, add example HTML output and
# highlight the code snippet.
addDocExamples = (block) ->
  block.docs = block.docs.reduce(
    (tokens, token) ->
      if token.type is 'code'
        tokens.push
          type: 'html'
          text: "<div class=\"styledocco-example\">#{token.text}</div>"
          pre: off
        token.text = highlight.highlightAuto(token.text).value
        token.escaped = yes
      tokens.push token
      tokens
    [])
  block

# Split into sections with headers as delimiters.
# FIXME: Make this recursive. Currently there can be max 1 section
# per code block...
splitter = (tot, cur, i) ->
  newSection = { docs: [], code: '' }
  if tot.length is 0
    tot.push cur
    return tot
  while cur.docs.length
    # Add current and following blocks to a new section if we find a heading.
    if cur.docs[0].type is 'heading' and cur.docs[0].depth <= 2
      while cur.docs.length
        newSection.docs.push cur.docs.shift()
    # Otherwise add to the previous section.
    else
      tot[tot.length-1].docs.push cur.docs.shift()
  
  # We have some docs in our new section.
  if newSection.docs.length
    newSection.code = cur.code
    tot.push newSection
  # There were no new sections in this block, add to previous section.
  else
    tot[tot.length-1].code += cur.code
  tot

# Run through marked parser to generate HTML.
parser = (block) ->
  docs: _.trimNewLines marked.parser block.docs
  code: _.trimNewLines block.code
