# The code/comment parser
# =======================

# Given a string of source code, find each comment and the code that
# follows it, and create an individual **section** for the code/doc pair.

exports.getDocs = (lang, data) ->
  lines = data.split '\n'
  docs = ''

  formatDocs = (line) -> "#{lang.filter(line)}\n"

  while lines.length

    # Add newlines (to separate different doc blocks) and continue.
    while lines.length and lang.checkType(lines[0]) is 'code'
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
