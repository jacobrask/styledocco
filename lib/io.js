var fs = (require)('fs');

exports.readFile = function(path, cb) {
  if (typeof window === 'undefined') {
    fs.readFile(path, 'utf8', cb);
  } else {
    // TODO: XHR
    cb(null, '');
  }
};
