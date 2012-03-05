(function() {

  exports.trimNewLines = function(str) {
    return str.replace(/^\n*/, '').replace(/\n*$/, '');
  };

}).call(this);
