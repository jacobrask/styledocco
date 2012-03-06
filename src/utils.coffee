# General purpose utitily functions
# =================================

# Trim newlines from beginning and end of multi line string.
exports.trimNewLines = (str) ->
  str.replace(/^\n*/, '').replace(/\n*$/, '')
