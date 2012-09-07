var config = module.exports;

config['StyleDocco parser'] = {
  environment: 'node',
  tests: [
    'parser.js',
    'cli.js'
  ]
};

config['Navigation'] = {
  environment: 'browser',
  rootPath: '../',
  libs: [
    'share/iterhate.js',
    'share/domsugar.js' ],
  sources: [ 'share/docs.ui.js' ],
  tests: [ 'test/browser/navigation.js' ]
};

config['Preview rendering'] = {
  environment: 'browser',
  rootPath: '../',
  libs: [
    'share/iterhate.js',
    'share/domsugar.js' ],
  sources: [
    'share/docs.previews.js'
  ],
  tests: [ 'test/browser/previews.js' ]
};

config['DOM sugar'] = {
  environment: 'browser',
  rootPath: '../',
  sources: [ 'share/domsugar.js' ],
  tests: [ 'test/browser/domsugar.js' ]
};
