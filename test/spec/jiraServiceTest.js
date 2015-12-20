/*jshint expr: true*/
(function() {
  'use strict';

  describe('jiraService', function() {

    var $httpBackend;

    beforeEach(module('jiraService'));

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should support authenticating with Basic authentication');

    describe('getAccountList', function() {
      it('should return list of accounts');
    });

    describe('submitTempo', function() {
      it('should be able to submit worklogs for internal issue');
      it('should be able to submit worklogs for non-internal issue with remaining estimate');
      it('should submit 0 remaining estimate when remaining estimate is negative');
    });

    describe('getRemainingEstimate', function() {
      it('should return estimate for non-internal issues');
      it('should return null for internal issues');
      it('should throw error for non-403 response');
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

  });

})();
