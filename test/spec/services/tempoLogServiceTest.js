/*jshint expr: true*/
(function() {
  'use strict';

  describe('tempoLogService', function() {

    var tempoLogService, jiraService, $q, $rootScope;

    var testDate, testDurationSeconds, testComment, testIssueKey, testAccountKey;

    beforeEach(module('tempoLogService'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('jiraService', {
          submitTempo: sinon.stub(),
          getAccountList: sinon.stub()
        });
      });
    });

    beforeEach(inject(function($injector) {
      tempoLogService = $injector.get('tempoLogService');
      jiraService = $injector.get('jiraService');
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');

      // Default appointment
      testDate = new Date();
      testDurationSeconds = 3600;
      testComment = 'test subject';
      testIssueKey = 'ISS-01';
      testAccountKey = 'ATT01';

      // Default mocks
      submitTempoStub().returns($q.when({
        data: { test: 'data' }
      }));

      jiraService.getAccountList.withArgs('ISS-01').returns($q.when([
        { key: 'ATT01', value: 'ATT01 - Test 01' },
        { key: 'ATT02', value: 'ATT02 - Test 02' }
      ]));
    }));

    describe('submit', function() {
      it('should submit work log via jiraService', function(done) {
        var data = submitLog();
        data.result.should.deep.equal({
          subject: 'test subject',
          issueKey: 'ISS-01',
          accountKey: 'ATT01',
          duration: 3600000,
          status: 'Processing',
          style: 'warning'
        });

        data.promise.should.eventually.deep.equal({
          subject: 'test subject',
          issueKey: 'ISS-01',
          accountKey: 'ATT01',
          duration: 3600000,
          status: 'Success',
          style: 'success',
          accountDescription: 'ATT01 - Test 01',
          response: {
            test: 'data'
          }
        }).and.notify(done);

        $rootScope.$digest();
      });

      it('should submit one work log at a time', function(done) {
        var data = submitLog();
        var data2 = submitLog();

        data.result.should.have.property('status', 'Processing');
        data2.result.should.have.property('status', 'Queued');

        $q.all([
          data.promise.should.eventually.have.property('status', 'Success'),
          data2.promise.should.eventually.have.property('status', 'Success')
        ]).should.notify(done);

        $rootScope.$digest();
      });

      it('should set the error message when there is an HTTP error', function(done) {
        submitTempoStub().returns($q.reject({
          statusText: 'Error status'
        }));

        var data = submitLog();

        $q.all([
          data.promise.should.eventually.have.property('status', 'Error'),
          data.promise.should.eventually.have.property('statusTooltip', 'Error status')
        ]).should.notify(done);

        $rootScope.$digest();
      });
      
      it('should set the error message when there is a JIRA error', function(done) {
        jiraService.submitTempo.withArgs(testDate, testDurationSeconds, testComment, testIssueKey, testAccountKey).returns($q.reject({
          data: { error: 'JIRA error message' }
        }));

        var data = submitLog();

        $q.all([
          data.promise.should.eventually.have.property('status', 'Error'),
          data.promise.should.eventually.have.property('statusTooltip').contains('JIRA error message')
        ]).should.notify(done);

        $rootScope.$digest();
      });

      it('should cache account list', function(done) {
        var data = submitLog();
        var data2 = submitLog();

        $q.all([
          data.promise.should.eventually.have.property('accountDescription', 'ATT01 - Test 01'),
          data2.promise.should.eventually.have.property('accountDescription', 'ATT01 - Test 01')
        ]).should.be.fulfilled.then(function() {
          jiraService.getAccountList.should.have.been.calledOnce;
        }).should.notify(done);

        $rootScope.$digest();
      });

    });

    function submitTempoStub() {
      return jiraService.submitTempo.withArgs(testDate, testDurationSeconds, testComment, testIssueKey, testAccountKey);
    }

    function submitLog() {
      return tempoLogService.submit(testDate, testDurationSeconds, testComment, testIssueKey, testAccountKey);
    }

  });

})();
