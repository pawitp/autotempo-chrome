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

describe('Exchange Log', function() {
  before(function() {
    $('#tabConfiguration a').click();
    var importExport = element(by.model('vm.importExport'));
    importExport.clear();
    importExport.sendKeys(JSON.stringify(require('../mock/config.json')));
    $('#btnImportConfig').click();

    $('#tabExchangeLog a').click();
  });

  afterEach(function() {
    $('#btnClearResult').click();
    $('#btnExchangeRefresh').click();
  });

  it('should fetch and display appointments from Exchange', function() {
    var appointments = element.all(by.repeater('appointment in exchangeLog.appointments'));
    appointments.count().should.eventually.equal(3);
    appointments.get(2).element(by.model('appointment.logType')).getAttribute('value').should.eventually.equal('Test Issue 3');
  });

  it('should log selected appointments to Tempo', function() {
    var appointments = element.all(by.repeater('appointment in exchangeLog.appointments'));
    appointments.get(0).element(by.model('appointment.logType')).element(by.css('option[value="Test Issue 1"]')).click();
    $('#btnExchangeSubmit').click();

    element.all(by.repeater('result in rc.results')).count().should.eventually.equal(2);
  });

  it('should show total number of hours in log button', function() {
    var appointments = element.all(by.repeater('appointment in exchangeLog.appointments'));
    $('#btnExchangeSubmit').getText().should.eventually.equal('Submit 12 hours');

    appointments.get(0).element(by.model('appointment.logType')).element(by.css('option[value="Test Issue 1"]')).click();
    $('#btnExchangeSubmit').getText().should.eventually.equal('Submit 24 hours');

    appointments.get(0).element(by.model('appointment.durationHours')).clear().sendKeys('0.33');
    appointments.get(2).element(by.model('appointment.durationHours')).clear().sendKeys('0.5');
    // Should not be "0.8300000000000001"
    $('#btnExchangeSubmit').getText().should.eventually.equal('Submit 0.83 hours');

    $('#btnExchangeSubmit').isEnabled().should.eventually.be.true;
  });

  it('should disable log button when no appointments are selected', function() {
    var appointments = element.all(by.repeater('appointment in exchangeLog.appointments'));
    appointments.get(2).element(by.model('appointment.logType')).element(by.css('option[value="Do not log"]')).click();
    $('#btnExchangeSubmit').getText().should.eventually.equal('Submit 0 hours');
    $('#btnExchangeSubmit').isEnabled().should.eventually.be.false;
  });

  it('should not display warning when logging for today', function() {
    $('#exchangeLogWarnDate').isDisplayed().should.eventually.be.false;
  });

  it('should display warning when logging for a different date', function() {
    $('#exchangeLogDate').sendKeys('02-01-2016');
    $('#exchangeLogWarnDate').isDisplayed().should.eventually.be.true;
  });

});
