# Trim newlines from beginning and end of string.
exports.trimNewLines = (str) -> str.replace(/^\n*/, '').replace(/\n*$/, '')
