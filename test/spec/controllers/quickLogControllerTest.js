/*jshint expr: true*/
(function() {
  'use strict';

  describe('quickLogController', function() {

    var vm, $scope, $rootScope, $q, tempoLogService;

    beforeEach(module('quickLogController'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('tempoLogService', {
          submit: sinon.stub()
        });
      });
    });

    beforeEach(inject(function($controller, $injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $q = $injector.get('$q');

      tempoLogService = $injector.get('tempoLogService');
      tempoLogService.submit.returns($q.when({
        result: 'test result'
      }));

      vm = $controller('QuickLogController', { $scope: $scope });

      $scope.$broadcast('configChanged', {
        logTypes: [
          { name: 'A' },
          { name: 'B' }
        ]
      });

    }));

    it('should load configuration on configChanged', function() {
      vm.date.setHours(0, 0, 0, 0).should.equal(new Date().setHours(0, 0, 0, 0));
      vm.logType.name.should.equal('Do not log');
      vm.durationHours.should.equal(0);
      vm.logTypes.should.deep.equal([
        { name: 'Do not log' },
        { name: 'A' },
        { name: 'B' }
      ]);
    });
    
    describe('applyLogType', function() {
      it('should apply issue key and account key', function() {
        vm.applyLogType({
          issueKey: 'INT-123',
          accountKey: 'ATT01',
          override: {}
        });

        vm.issueKey.should.equal('INT-123');
        vm.accountKey.should.equal('ATT01');
      });
      it('should override log comment', function() {
        vm.applyLogType({
          override: {
            comment: 'asdf'
          }
        });
        vm.comment.should.equal('asdf');
      });
      it('should not change comment if override is not specified', function() {
        vm.comment = 'fdas';
        vm.applyLogType({ override: {} });
        vm.comment.should.equal('fdas');
      });
    });

    describe('submitQuickLog', function() {
      it('should submit log and broadcast result', function() {
        vm.date = new Date();
        vm.durationHours = 1;
        vm.comment = 'Test comment';
        vm.issueKey = 'TAT-01';
        vm.accountKey = 'ATT01';

        vm.submitQuickLog();

        tempoLogService.submit.should.have.been.calledWithMatch(
          vm.date,
          3600,
          'Test comment',
          'TAT-01',
          'ATT01'
        );
        
        // Reset form
        vm.logType.name.should.equal('Do not log');
        vm.durationHours.should.equal(0);
        vm.comment.should.be.empty;
      });
    });

    describe('isToday', function() {
      it('should return true for today', function() {
        vm.date = new Date();
        vm.isToday().should.be.true;
      });
      it('should return false for different day', function() {
        vm.date = new Date('2011-01-01');
        vm.isToday().should.be.false;
      });
    });

  });

})();
