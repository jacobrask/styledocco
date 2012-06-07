var fs = require('fs');
var path = require('path');
var langs = require('../lib/languages');
var parser = require('../lib/parser');

var cssDir = "" + __dirname + "/fixtures/css";

exports["Extract docs+code blocks"] = function(test) {
  var cssFiles = fs.readdirSync(cssDir).filter(function(filename) {
    return path.extname(filename) === '.css';
  });
  var extracted, file, saved;
  for (var i = 0, len = cssFiles.length; i < len; i++) {
    file = cssFiles[i];
    extracted = parser.extractBlocks(
      langs.getLanguage(file),
      fs.readFileSync(path.join(cssDir, file), 'utf-8')
    );
    saved = JSON.parse(
      fs.readFileSync(
        cssDir + "/" + (path.basename(file, path.extname(file))) + ".blocks.json",
        'utf-8'
      )
    );
    test.deepEqual(extracted, saved, "Match failed for " + cssDir + "/" + file);
  }
  test.done();
};

exports["Get documentation tokens"] = function(test) {
  var cssFiles = fs.readdirSync(cssDir).filter(function(filename) {
    return path.extname(filename) === '.css';
  });
  var extracted, file, saved;
  for (var i = 0, len = cssFiles.length; i < len; i++) {
    file = cssFiles[i];
    extracted = JSON.parse(JSON.stringify(
      parser.makeSections(
        parser.extractBlocks(
          langs.getLanguage(file),
          fs.readFileSync(
            path.join(cssDir, file), 'utf-8'
          )
        )
      )
    ));
    saved = JSON.parse(
      fs.readFileSync(
        cssDir + "/" + (path.basename(file, path.extname(file))) + ".sections.json",
        'utf-8'
      )
    );
    test.deepEqual(extracted, saved, "Match failed for " + cssDir + "/" + file);
  }
  test.done();
};
