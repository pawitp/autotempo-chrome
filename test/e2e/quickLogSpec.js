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
    var importExport = element(by.model('vm.importExport'));
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
    $('#quickComment').getAttribute('readonly').should.eventually.be.null;
    $('#quickSubmit').click();

    element.all(by.repeater('result in rc.results')).count().should.eventually.equal(1);
  });

  it('should disable custom comment when overridden', function() {
    $('#quickLogType option[value="Test Issue 2"]').click();
    $('#quickComment').getAttribute('value').should.eventually.equal('override_subj');
    $('#quickComment').getAttribute('readonly').should.eventually.equal('true');
  });

  it('should disable log button when no type is selected', function() {
    $('#quickLogType option[value="Do not log"]').click();
    $('#quickSubmit').isEnabled().should.eventually.be.false;
  });

  it('should not display warning when logging for today', function() {
    $('#quickLogWarnDate').isDisplayed().should.eventually.be.false;
  });

  it('should display warning when logging for a different date', function() {
    $('#quickDate').sendKeys('02-01-2016');
    $('#quickLogWarnDate').isDisplayed().should.eventually.be.true;
  });
});
