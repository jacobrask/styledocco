'use strict';

var fs = require('fs');

exports.readFile = function(path, cb) {
  if (typeof window === 'undefined') {
    fs.readFile(path, 'utf8', cb);
  } else {
    var req = new XMLHttpRequest();
    req.open('GET', path, true);
    req.send();
    req.onreadystatechange = function() {
      if (this.readyState !== 4) return;
      cb(null, this.responseText);
    };
  }
};

exports.readFileSync = function(path) {
  if (typeof window === 'undefined') {
    return fs.readFileSync(path, 'utf8');
  } else {
    var req = new XMLHttpRequest();
    req.open('GET', path, false);
    req.send();
    return req.responseText;
  }
};
