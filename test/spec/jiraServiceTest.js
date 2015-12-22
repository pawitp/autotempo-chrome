/*jshint expr: true*/
(function() {
  'use strict';

  describe('jiraService', function() {

    var $httpBackend, jiraService;

    beforeEach(module('jiraService'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('configService', {
          getJiraCredentials: function() {
            return {
              username: 'username',
              password: 'password',
              spnego: false
            };
          },
          getJiraUrl: function() {
            return 'https://jira.example.com/';
          }
        });
      });
    });


    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      jiraService = $injector.get('jiraService');
    }));

    it('should support authenticating with Basic authentication', function() {
      $httpBackend
        .expect('GET', 'https://jira.example.com/rest/tempo-rest/1.0/accounts/json/billingKeyList/INT-123?callback=fn', undefined, function(headers) {
          headers.Authorization.should.equal('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
          return true;
        }).respond(500, '');

      jiraService.getAccountList('INT-123');

      $httpBackend.flush();
    });

    describe('getAccountList', function() {
      it('should return list of accounts', function() {
        $httpBackend.expect('GET', 'https://jira.example.com/rest/tempo-rest/1.0/accounts/json/billingKeyList/INT-123?callback=fn')
          .respond('fn({"values":[{"key":"ATT01","value":"ATT01 - Test 01","global":true,"selected":false},{"key":"ATT02","value":"ATT02 - Test 02","global":true,"selected":false}]})');

        var result = jiraService.getAccountList('INT-123');
        result.should.eventually.have.length.of(2);
        result.should.eventually.have.deep.property('[0].key', 'ATT01');
        result.should.eventually.have.deep.property('[0].value', 'ATT01 - Test 01');
        result.should.eventually.have.deep.property('[1].key', 'ATT02');
        result.should.eventually.have.deep.property('[1].value', 'ATT02 - Test 02');

        $httpBackend.flush();
      });
    });

    describe('submitTempo', function() {
      it('should send application/json content type');
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
