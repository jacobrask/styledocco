var config = module.exports;

config['StyleDocco parser'] = {
  env: 'node',
  tests: [
    'cli.js'
  ]
};

config['App'] = {
  env: 'browser',
  tests: [ 'lib/*.js' ]
};
