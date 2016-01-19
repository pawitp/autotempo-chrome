/*jshint expr: true*/
'use strict';

var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

Object.defineProperty(
  protractor.promise.Promise.prototype,
  'should',
  Object.getOwnPropertyDescriptor(Object.prototype, 'should')
);

describe('Initialization', function() {

  it('should not have errors in the console log', function(done) {
    $('#tabConfiguration a').click();
    browser.manage().logs().get('browser').then(function(browserLogs) {
      browserLogs.forEach(function(log) {
        if (log.message.includes('history.pushState is not available in packaged apps.') ||
          log.message.includes('exchange.asmx 0:0 Failed to load resource')) {
          // Expected errors
          return;
        }

        if (log.level.value > 900) {
          throw 'Unexpected error: ' + log.message;
        }
      });
      done();
    });
  });

});
