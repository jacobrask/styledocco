'use strict';

var doc = document;

buster.testCase("CSS sandboxing", {
  tearDown: function() {
    doc.body.innerHTML = '';
    doc.head.innerHTML = '';
  },
  "Same origin data uri feature detection": function(done) {
    sandbocss.sameOriginDataUri(function(support) {
      if (doc.defaultView.navigator.userAgent.match(/webkit/i)) {
        refute(support);
      } else {
        assert(support);
      }
      done();
    });
  },
  "Create an iframe": function() {
    assert.equals(sandbocss.createLocalIFrame(true).src.split(':')[0], 'data');
    assert.equals(sandbocss.createLocalIFrame(false).src, location.href + '#__sandbocss__');
  },
  "Replace document content": function() {
    sandbocss.replaceDocumentContent(
      doc,
      'TESTING',
      'body{display:none}'
    );
    assert.equals(doc.body.innerHTML, 'TESTING', 'Change body content');
    assert.equals(
      doc.defaultView.getComputedStyle(doc.body).getPropertyValue('display'),
      'none', 'Update document styles');
  }
});
