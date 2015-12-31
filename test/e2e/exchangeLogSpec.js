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
    var importExport = element(by.model('configuration.importExport'));
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

    element.all(by.repeater('result in results')).count().should.eventually.equal(2);
  });
});
