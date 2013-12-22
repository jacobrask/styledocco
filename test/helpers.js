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
  heading: function(d, s) {
    var n = this.custom("heading", s);
    n.depth = d;
    delete n.text;  // chai eql depends on order of properties
    n.text = s;
    return n;
  },
  paragraph: function(s) { return this.custom("paragraph", s); },
  heading1:  function(s) { return this.heading(1, s.substr(2).trim()); },
  heading2:  function(s) { return this.heading(2, s.substr(3).trim()); },
  code:      function(s) { return this.custom("code", s);      }
};
