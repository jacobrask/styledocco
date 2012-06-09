var async = require('async');
var io = require('../lib/io');
var path = require('path');
var parser = require('../lib/parser');

var fixturePath;
if (typeof window === 'undefined') {
  fixturePath = path.join(__dirname, '/fixtures/');
} else {
  fixturePath = 'fixtures';
}
var fixtures = [ 'normal', 'structured' ];

exports["Extract docs and code blocks"] = function(test) {
  async.forEach(fixtures, function(fixName, cb) {
    async.parallel({
      css: function(cb2) {
        io.readFile(fixturePath + fixName + '.css', cb2);
      },
      blocks: function(cb2) {
        io.readFile(fixturePath + fixName + '.blocks.json', cb2);
      }
    },
    function(err, res) {
      if (err != null) throw err;
      var extracted = parser.separate(res.css);
      var saved = JSON.parse(res.blocks);
      test.deepEqual(extracted, saved, "Match failed for " + fixName);
      cb();
    });
  }, test.done);
};
