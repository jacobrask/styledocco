'use strict';

var doc = document;

buster.testCase("Iframes", {
  "Same origin data uri feature detect": function(done) {
    test.sameOriginDataUri(doc, function(err, support) {
      if (doc.defaultView.navigator.userAgent.match(/webkit/i)) {
        refute(support);
      } else {
        assert(support);
      }
      done();
    });
  }
});
