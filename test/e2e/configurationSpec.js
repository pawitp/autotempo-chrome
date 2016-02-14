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

describe('Configuration', function() {
  before(function() {
    $('#tabConfiguration a').click();
  });

  it('should save authentication configuration', function() {
    $('#exchangeUrl').sendKeys('http://localhost:9001');
    $('#exchangeUsername').sendKeys('mydomain\\myusername');
    $('#exchangePassword').sendKeys('mypassword');
    $('#jiraUrl').sendKeys('jira.mycompany.com');
    $('#jiraUsername').sendKeys('myjirausername');
    $('#jiraPassword').sendKeys('myjirapassword');

    $('#btnSaveConfig').click();
    $('#btnSaveConfig').isEnabled().should.eventually.be.false;
    $('#jiraUrl').getAttribute('value').should.eventually.equal('http://jira.mycompany.com/');
  });

  it('should save log types configuration', function() {
    $('#btnAddLogType').click();
    var logTypes = element.all(by.repeater('logType in vm.config.logTypes'));
    var row = logTypes.get(0);
    row.element(by.model('logType.name')).sendKeys('Test Issue 1');
    row.element(by.model('logType.issueKey')).sendKeys('TP-1');
    row.element(by.model('logType.accountKey')).sendKeys('ATT01');

    $('#btnAddLogType').click();
    row = logTypes.get(1);
    row.element(by.model('logType.name')).sendKeys('Test Issue 2');
    row.element(by.model('logType.issueKey')).sendKeys('TP-2');
    row.element(by.model('logType.accountKey')).sendKeys('ATT02');

    $('#btnAddLogType').click();
    row = logTypes.get(2);
    row.element(by.model('logType.name')).sendKeys('Test Issue 3');
    row.element(by.model('logType.issueKey')).sendKeys('TP-3');
    row.element(by.model('logType.accountKey')).sendKeys('ATT03');
    row.element(by.css('.btnAddRule')).click();
    row.element(by.model('rule.field')).element(by.css('option[value=subject]')).click();
    row.element(by.model('rule.op')).element(by.css('option[value=contains]')).click();
    row.element(by.model('rule.value')).sendKeys('test');

    element.all(by.repeater('logType in vm.config.logTypes')).count().should.eventually.equal(3);

    $('#btnSaveConfig').click();
    $('#btnSaveConfig').isEnabled().should.eventually.be.false;
  });

  it('should export configuration', function() {
    $('#exchangeUrl').clear();
    $('#exchangeUrl').sendKeys('http://localhost:9001/testexport');
    $('#btnSaveConfig').click();

    $('#btnExportConfig').click();
    element(by.model('vm.importExport')).getAttribute('value').should.eventually.contains('testexport');
  });

  it('should import configuration', function() {
    var importExport = element(by.model('vm.importExport'));
    importExport.clear();
    importExport.sendKeys('{"exchange": {"url": "http://localhost:9001/testimport/"}, "jira": {"url": "http://testjiraurl/"}}');
    $('#btnImportConfig').click();

    $('#exchangeUrl').getAttribute('value').should.eventually.equal('http://localhost:9001/testimport/');
    $('#jiraUrl').getAttribute('value').should.eventually.equal('http://testjiraurl/');
  });

  it('should show popup when trying to exit configuration screen without saving and save changes when Yes is selected', function() {
    $('#exchangeUsername').clear();
    $('#exchangeUsername').sendKeys('testpopupyes');

    $('#tabExchangeLog a').click();
    $('#warnDirtyConfig').isDisplayed().should.eventually.be.true;

    $('#warnDirtyConfig .btn-primary').click();
    $('#warnDirtyConfig').isPresent().should.eventually.be.false;

    $('#tabConfiguration a').click();
    $('#exchangeUsername').getAttribute('value').should.eventually.equal('testpopupyes');
  });

  it('should show popup when trying to exit configuration screen without saving and discard changes when No is selected', function() {
    $('#exchangeUsername').clear();
    $('#exchangeUsername').sendKeys('testpopupno');

    $('#tabExchangeLog a').click();
    $('#warnDirtyConfig').isDisplayed().should.eventually.be.true;

    $('#warnDirtyConfig .btn-warning').click();
    $('#warnDirtyConfig').isPresent().should.eventually.be.false;

    $('#tabConfiguration a').click();
    $('#exchangeUsername').getAttribute('value').should.eventually.not.equal('testpopupno');
  });

});
