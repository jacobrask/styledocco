var config = module.exports;

config['StyleDocco'] = {
  env: 'node',
  tests: [
    'cli.js',
    'models/*.js'
  ]
};

/*
config['Views'] = {
  env: 'browser',
  // Tests are Browserified via grunt
  tests: [ 'lib/views.js' ]
};
*/
