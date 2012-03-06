# The code/comment parser
# =======================

# Given a string of source code, find each comment and the code that
# follows it, and create an individual **section** for the code/doc pair.

module.exports = (lang, data) ->
  lines = data.split '\n'
  sections = []

  formatDocs = (line) -> "#{lang.filter(line)}\n"
  formatCode = (line) -> "#{line}\n"

  # We loop through the array backwards because `pop` is faster than `splice`.
  while lines.length
    docs = code = ''

    # Since we're looping backwards, first add the code.
    while lines.length and lang.checkType(lines[lines.length-1]) is 'code'
      code = formatCode(lines.pop()) + code

    # Now check for any single line comments.
    while lines.length and lang.checkType(lines[lines.length-1]) is 'single'
      docs = formatDocs(lines.pop()) + docs

    # A multi line comment ends here, add lines until comment start.
    if lines.length and lang.checkType(lines[lines.length-1]) is 'multiend'
      # We want the start line, so `break` *after* line is added.
      while lines.length
        line = lines.pop()
        docs = formatDocs(line) + docs
        break if lang.checkType(line) is 'multistart'

    # Save code/doc pair.
    sections.push { docs, code }

  sections.reverse()
