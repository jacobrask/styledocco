var config = module.exports;

config['StyleDocco parser'] = {
  env: 'node',
  tests: [
    'cli.js'
  ]
};

config['Web'] = {
  env: 'browser',
  // Tests are Browserified via grunt
  tests: [ 'lib/*.js' ]
};
