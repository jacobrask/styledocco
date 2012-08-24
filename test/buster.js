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
    "share/previews.js",
  ],
  tests: [
    "test/browser/stylesheets.js",
    "test/browser/preview-height.js"
  ]
};
