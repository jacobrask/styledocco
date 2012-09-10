var config = module.exports;

config['StyleDocco parser'] = {
  environment: 'node',
  tests: [
    'parser.js',
    'cli.js'
  ]
};

config['App'] = {
  environment: 'browser',
  rootPath: '../',
  tests: [ 'test/browser/lib/*.js' ]
};
