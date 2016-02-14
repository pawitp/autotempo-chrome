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
    
    describe('overrideComment', function() {
      it('should override log comment', function() {
        vm.overrideComment('asdf');
        vm.comment.should.equal('asdf');
        vm.commentReadOnly.should.be.true;
      });
      it('should not change comment if override is not specified', function() {
        vm.comment = 'fdas';
        vm.commentReadOnly = true;
        vm.overrideComment(undefined);
        vm.comment.should.equal('fdas');
        vm.commentReadOnly.should.be.false;
      });
    });

    describe('submitQuickLog', function() {
      it('should submit log and broadcast result', function() {
        var logType = { issueKey: 'TAT-01', accountKey: 'ATT01' };

        vm.date = new Date();
        vm.durationHours = 1;
        vm.comment = 'Test comment';
        vm.logType = logType;
        
        vm.submitQuickLog();
        
        tempoLogService.submit.should.have.been.calledWithMatch({
          start: vm.date,
          duration: 3600,
          subject: 'Test comment',
          logType: logType
        });
        
        // Reset form
        vm.logType.name.should.equal('Do not log');
        vm.durationHours.should.equal(0);
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
