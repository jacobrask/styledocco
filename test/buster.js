var config = module.exports;

config["StyleDocco parser"] = {
  environment: "node",
  tests: [
    "parser.js",
    "cli.js"
  ]
};
config["Preview scripts"] = {
  environment: "browser",
  rootPath: '../',
  sources: [
    "test/browser/setup.js",
    "node_modules/iterhate/iterhate.js",
    "share/utils.js",
    "share/previews.js",
    "share/docs.previews.js"
  ],
  tests: [
    "test/browser/stylesheets.js",
    "test/browser/preview-height.js",
    "test/browser/iframes.js",
    "test/browser/code-editing.js"
  ]
};
