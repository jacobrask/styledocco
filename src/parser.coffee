# The code/comment parser
# =======================

# Given a string of source code, find each comment and the code that
# follows it, and create an individual **section** for the code/doc pair.

exports.getDocs = (lang, data) ->
  lines = data.split '\n'
  docs = ''

  formatDocs = (line) -> "#{lang.filter(line)}\n"

  while lines.length

    # Add newlines (to separate different doc blocks) and continue. `multiend`
    # is ignored because we probably encountered the end of an ignored multi-
    # line comment.
    while lines.length and \
    (lang.checkType(lines[0]) is 'code' or lang.checkType(lines[0]) is 'multiend')
      docs += '\n'
      lines.shift()

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

  docs


# Split docs into section, delimited by where there are headings or hr's.
exports.makeSections = (tokens) ->
  sections = []
  while tokens.length
    if (tokens[0].type is 'heading' and tokens[0].depth <= 2) or tokens[0].type is 'hr'
      # Ignore hr's, used only as section delimiters.
      if tokens[0].type is 'hr'
        tokens.shift()
      # Save current section.
      if section?.length or not tokens.length
        sections.push section
      if tokens.length
        # Start again on new section.
        section = [ tokens.shift() ]
    else
      (section?=[]).push tokens.shift()
      unless tokens.length
        sections.push section

  sections


# If first token is an h1, assume it's the document title.
exports.getTitle = (tokens) ->
  tokens[0]?.text if tokens[0]?.type is 'heading' and tokens[0]?.depth is 1
  
# If first token is an h1, assume it's the document title.
exports.getDescription = (tokens) ->
  tokens[0]?.text if tokens[0]?.type is 'paragraph'
