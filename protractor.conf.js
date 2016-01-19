exports.config = {
  specs: [
    'test/e2e/run_first/initSpec.js',
    'test/e2e/*.js'
  ],
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': [
        '--load-and-launch-app=app'
      ]
    }
  },
  chromeOnly: true,
  directConnect: true,
  framework: 'mocha',
  allScriptsTimeout: 11000,
  mochaOpts: {
    timeout: 100000
  },

  onPrepare: function() {
    // Switch to Chrome App window
    var switchToChromeWindow = function (handles) {
      if (handles == undefined || handles.length != 2) {
        console.log('Waiting for app launch...');
        browser.sleep(100);
        return browser.getAllWindowHandles().then(switchToChromeWindow);
      } else {
        return browser.switchTo().window(handles[1]);
      }
    }

    return switchToChromeWindow();
  }
};