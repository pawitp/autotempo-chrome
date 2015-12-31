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

describe('Quick Log', function() {
  before(function() {
    $('#tabConfiguration a').click();
    var importExport = element(by.model('configuration.importExport'));
    importExport.clear();
    importExport.sendKeys(JSON.stringify(require('../mock/config.json')));
    $('#btnImportConfig').click();

    $('#tabQuickLog a').click();
  });

  afterEach(function() {
    $('#btnClearResult').click();
  });

  it('should send specified time log to Tempo', function() {
    $('#quickLogType option[value="Test Issue 1"]').click();
    $('#quickDuration').sendKeys('1.5');
    $('#quickComment').sendKeys('Test Comment');
    $('#quickSubmit').click();

    element.all(by.repeater('result in results')).count().should.eventually.equal(1);
  });
});
