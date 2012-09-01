var config = module.exports;

config['StyleDocco parser'] = {
  environment: 'node',
  tests: [
    'parser.js',
    'cli.js'
  ]
};

config['Sandbocss'] = {
  environment: 'browser',
  rootPath: '../',
  sources: [ 'share/sandbocss.js' ],
  tests: [ 'test/browser/sandbocss.js' ]
};
