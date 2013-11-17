var getFiles = require('../cli').getFiles
  , expect = require('chai').expect
  ;

// Allow non-mocha frameworks to skip over these tests.
if (!global.describe) { process.exit(); }

describe('getFiles', function() {
  it('Runs the callback with an array of files in the 2nd arg', function(done) {
    getFiles(__dirname, function(err, n) {
      expect(n.length).to.equal(26);
      done();
    })
  });
});
