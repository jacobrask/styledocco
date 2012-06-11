var async = require('async');
var io = require('../lib/io');
var path = require('path');
var parser = require('../lib/parser');

var fixturePath;
if (typeof window === 'undefined') {
  fixturePath = path.join(__dirname, '/fixtures/');
} else {
  fixturePath = 'fixtures/';
}
var cssFixtures = [ 'asterisk.css', 'comments.css', 'invalid.css',
                    'normal.css', 'structured.css' ];

var docFixtures = [ 'docs.md' ];

exports["Separate docs and code blocks"] = function(test) {
  async.forEach(cssFixtures, function(fixName, cb) {
    async.parallel({
      css: function(cb2) {
        io.readFile(fixturePath + fixName, cb2);
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

exports["Make sections"] = function(test) {
  async.forEach(cssFixtures, function(fixName, cb) {
    async.parallel({
      css: function(cb2) {
        io.readFile(fixturePath + fixName, cb2);
      },
      sections: function(cb2) {
        io.readFile(fixturePath + fixName + '.sections.json', cb2);
      }
    },
    function(err, res) {
      if (err != null) throw err;
      var extracted = JSON.parse(JSON.stringify(parser.makeSections(
        parser.separate(res.css)
      )));
      var saved = JSON.parse(res.sections);
      test.deepEqual(extracted, saved, "Match failed for " + fixName);
      cb();
    });
  }, test.done);
};


exports["Parse standalone documentation"] = function(test) {
  async.forEach(docFixtures, function(fixName, cb) {
    async.parallel({
      docs: function(cb2) {
        io.readFile(fixturePath + fixName, cb2);
      },
      sections: function(cb2) {
        io.readFile(fixturePath + fixName + '.sections.json', cb2);
      }
    },
    function(err, res) {
      if (err != null) throw err;
      var extracted = JSON.parse(JSON.stringify(parser.makeSections(
        [ { docs: res.docs,
            code: '' } ]
      )));
      var saved = JSON.parse(res.sections);
      test.deepEqual(extracted, saved, "Match failed for " + fixName);
      cb();
    });
  }, test.done);
};
