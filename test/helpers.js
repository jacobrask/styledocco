exports.this_dir = function(s) {
  return __dirname + '/' + (s || '');
}

exports.array_with_links = function() {
  var a = [];
  for (var i=0, len=arguments.length; i<len; ++i) {
    a[i] = arguments[i];
  }
  a.links = {};
  return a;
};

if (!String.prototype.supplant) {
  String.prototype.supplant = function (o) {
    return this.replace(
        /\{([^{}]*)\}/g,
        function (a, b) {
          var r = o[b];
          return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
        );
  };
}

exports.parse_tree = {
  custom: function(t, s) {
    return {
      type: t,
      text: s
    };
  },
  paragraph: function(s) { return this.custom("paragraph", s); },
  code:      function(s) { return this.custom("code", s); }
};
