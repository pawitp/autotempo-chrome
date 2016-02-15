/*jshint expr: true*/
(function() {
  'use strict';

  describe('jiraService', function() {

    var $httpBackend, $q, jiraService;

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
      $q = $injector.get('$q');
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
      it('should return list of accounts', function(done) {
        $httpBackend.expect('GET', 'https://jira.example.com/rest/tempo-rest/1.0/accounts/json/billingKeyList/INT-123?callback=fn')
          .respond('fn({"values":[{"key":"ATT01","value":"ATT01 - Test 01","global":true,"selected":false},{"key":"ATT02","value":"ATT02 - Test 02","global":true,"selected":false}]})');

        var result = jiraService.getAccountList('INT-123');

        $q.all([
          result.should.eventually.have.length.of(2),
          result.should.eventually.have.deep.property('[0].key', 'ATT01'),
          result.should.eventually.have.deep.property('[0].value', 'ATT01 - Test 01'),
          result.should.eventually.have.deep.property('[1].key', 'ATT02'),
          result.should.eventually.have.deep.property('[1].value', 'ATT02 - Test 02')
        ]).should.notify(done);

        $httpBackend.flush();
      });
    });

    describe('submitTempo', function() {
      it('should send application/json content type', function() {
        mockRemainingEstimateOfInternalIssue('INT-2');

        $httpBackend
          .expect('POST', 'https://jira.example.com/rest/tempo-timesheets/3/worklogs/', undefined, function(headers) {
            headers['Content-Type'].should.equal('application/json');
            return true;
          }).respond(500, '');

        jiraService.submitTempo(new Date('2015-12-26T08:39:12.540Z'), 10000, 'Subject', 'INT-2', 'ATT02');

        $httpBackend.flush();
      });

      it('should be able to submit worklogs for internal issue', function() {
        mockRemainingEstimateOfInternalIssue('INT-2');

        $httpBackend
          .expect('POST', 'https://jira.example.com/rest/tempo-timesheets/3/worklogs/', {
            dateStarted: '2015-12-26T15:39:12',
            timeSpentSeconds: 36000,
            comment: 'Subject',
            author: { name: 'username' },
            issue: { key: 'INT-2' },
            worklogAttributes: [{ key: '_Account_', value: 'ATT02' }]
          }).respond({});

        jiraService.submitTempo(new Date('2015-12-26T08:39:12.540Z'), 36000, 'Subject', 'INT-2', 'ATT02');

        $httpBackend.flush();
      });

      it('should be able to submit worklogs for non-internal issue with remaining estimate', function() {
        mockRemainingEstimate('TP-2', 37000);

        $httpBackend
          .expect('POST', 'https://jira.example.com/rest/tempo-timesheets/3/worklogs/', {
            dateStarted: '2015-12-26T15:39:12',
            timeSpentSeconds: 36000,
            comment: 'Subject',
            author: { name: 'username' },
            issue: {
              key: 'TP-2',
              remainingEstimateSeconds: 1000,
            },
            worklogAttributes: [{ key: '_Account_', value: 'ATT02' }]
          }).respond({});

        jiraService.submitTempo(new Date('2015-12-26T08:39:12.540Z'), 36000, 'Subject', 'TP-2', 'ATT02');

        $httpBackend.flush();
      });

      it('should submit 0 remaining estimate when remaining estimate is negative', function() {
        mockRemainingEstimate('TP-2', 3000);

        $httpBackend
          .expect('POST', 'https://jira.example.com/rest/tempo-timesheets/3/worklogs/', {
            dateStarted: '2015-12-26T15:39:12',
            timeSpentSeconds: 36000,
            comment: 'Subject',
            author: { name: 'username' },
            issue: {
              key: 'TP-2',
              remainingEstimateSeconds: 0,
            },
            worklogAttributes: [{ key: '_Account_', value: 'ATT02' }]
          }).respond({});

        jiraService.submitTempo(new Date('2015-12-26T08:39:12.540Z'), 36000, 'Subject', 'TP-2', 'ATT02');

        $httpBackend.flush();
      });

      it('should reject promise on other errors', function() {
        $httpBackend.when('GET', 'https://jira.example.com/rest/api/2/issue/INT-2?fields=timetracking')
          .respond(404, '');

        jiraService.submitTempo(new Date('2015-12-26T08:39:12.540Z'), 36000, 'Subject', 'INT-2', 'ATT02').should.be.rejected;

        $httpBackend.flush();
      });
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function mockRemainingEstimate(issue, estimate) {
      $httpBackend.when('GET', 'https://jira.example.com/rest/api/2/issue/' + issue + '?fields=timetracking')
        .respond({
          fields: {
            timetracking: {
              remainingEstimateSeconds: estimate
            }
          }
        });
    }

    function mockRemainingEstimateOfInternalIssue(issue) {
      $httpBackend.when('GET', 'https://jira.example.com/rest/api/2/issue/' + issue + '?fields=timetracking')
        .respond(403, '');
    }

  });

})();
