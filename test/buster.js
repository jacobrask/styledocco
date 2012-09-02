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

config['Preview rendering'] = {
  environment: 'browser',
  rootPath: '../',
  libs: [
    'share/iterhate.js',
    'share/domsugar.js',
    'share/sandbocss.js' ],
  sources: [
    'share/previews.js'
  ],
  tests: [ 'test/browser/previews.js' ]
};
