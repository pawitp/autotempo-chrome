exports.config = {
  specs: [
    'test/e2e/*.js'
  ],
  capabilities: {
    'browserName': 'chrome'
  },
  chromeOnly: true,
  baseUrl: 'http://localhost:8000/',
  framework: 'mocha',
  allScriptsTimeout: 11000
};