var gather = require('../src/gather')
  , expect = require('chai').expect
  , helper = require('./helpers')
  ;

// Allow non-mocha frameworks to skip over these tests.
if (!global.describe) { process.exit(); }

describe('gather', function() {
  // Contains functions used for gathering all of the files that will
  // be used by Styledocco as it generates the documentation.
  
  it('returns a method for gathering input files', function() {
    expect(gather().files).to.exist;
  });

  describe('files', function() {
    it('Ignores hidden files', function(done) {
      gather({"in": [helper.this_dir('fixtures/input-files')]}).files(function(err, files) {
        for (var i in files) {
          expect(files[i]).to.not.match(/^\./);
        }
        done();
      });
    });

    it('has a file extension matching the allowed file types', function(done) {
      gather({"in": [helper.this_dir('fixtures/input-files')]}).files(function(err, files) {
        for (var i in files) {
          // Expect css, scss, sass, less, or styl.
          expect(files[i]).to.match(/.*\.(s?[ca]ss|less|styl)$/);
        }
        done();
      });
    });
  });
});
