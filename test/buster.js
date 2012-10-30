var config = module.exports;

config['StyleDocco'] = {
  env: 'node',
  tests: [
    'cli.js',
    'parser.js'
  ]
};

/*
config['Views'] = {
  env: 'browser',
  // Tests are Browserified via grunt
  tests: [ 'lib/views.js' ]
};
*/
