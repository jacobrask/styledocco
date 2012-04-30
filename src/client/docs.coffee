# Helper function needed to deal with array-like stylesheet objects.
toArray = (obj) -> Array::slice.call obj

# Scans your stylesheet for pseudo classes and adds a class with the same name.
# Thanks to Knyle Style Sheets for the idea.

processStyles = ->
  # Compile regular expression.
  pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
              'enabled', 'disabled', 'checked' ]
  pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi")

  # Only get inline style elements, and only the first one
  styleSheet = toArray(document.styleSheets).filter((ss) -> not ss.href?)[0]
  if styleSheet?
    processedStyles = toArray(styleSheet.cssRules).filter((rule) ->
      # Keep only rules with pseudo classes.
      rule.selectorText and rule.selectorText.match pseudoRe
    ).map((rule) ->
      # Replace : with . and encoded :
      rule.cssText.replace pseudoRe, ".\\3A $1"
    ).reduce((prev, cur) ->
      prev + cur
    )

    # Add the styles to the document
    styleEl = document.createElement "style"
    styleEl.appendChild document.createTextNode processedStyles
    document.getElementsByTagName("head")[0].appendChild styleEl
