# Scans your stylesheet for pseudo classes and adds a class with the same name.
# Thanks to Knyle Style Sheets for the idea.
$ ->
  addPseudoClasses()

add = (a, b) -> a + b

addPseudoClasses = ->
  # Compile regular expression.
  pseudos = [ 'link', 'visited', 'hover', 'active', 'focus', 'target',
              'enabled', 'disabled', 'checked' ]
  pseudoRe = new RegExp(":((" + pseudos.join(")|(") + "))", "gi")

  processedPseudoClasses = _.toArray(document.styleSheets)
    # Filter out `link` elements.
    .filter(
      (ss) ->
        not ss.href?
    ).map((ss) ->
      _.toArray(ss.cssRules)
      .filter((rule) ->
        # Keep only rules with pseudo classes.
        rule.selectorText and rule.selectorText.match pseudoRe
      ).map((rule) ->
        # Replace : with . and encoded :
        rule.cssText.replace pseudoRe, ".\\3A $1"
      ).reduce(add)
    ).reduce(add, '')

  if processedPseudoClasses.length
    # Add a new style element with the processed pseudo class styles.
    $('head').append $('<style />').text(processedPseudoClasses)
