/*jshint expr: true*/
(function() {
  'use strict';

  describe('exchangeLogController', function() {

    var vm, $scope, $rootScope, $q, tempoLogService, exchangeService;

    const APPOINTMENTS = [
      {
        itemId: 'ID1',
        subject: 'Test Appointment !',
        start: new Date('2015-11-20T01:00:00.000Z'),
        end: new Date('2015-11-20T01:30:00.000Z'),
        categories: [
          'Training'
        ],
        myResponseType: 'Organizer'
      },
      {
        itemId: 'ID2',
        subject: 'Test Appointment 2',
        start: new Date('2015-11-20T03:30:00.000Z'),
        end: new Date('2015-11-20T04:00:00.000Z'),
        categories: [],
        myResponseType: 'Organizer'
      },
      {
        itemId: 'ID3',
        subject: 'Test Appointment 3',
        start: new Date('2015-11-20T11:00:00.000Z'),
        end: new Date('2015-11-20T11:20:00.000Z'),
        categories: [],
        myResponseType: 'Organizer'
      }
    ];

    const LOG_TYPES = [
      {
        accountKey: 'ATT01',
        issueKey: 'TP-1',
        name: 'Test 1',
        override: { comment: '' },
        rules: [{ field: 'subject', op: 'contains', value: '2' }]
      },
      {
        accountKey: 'ATT02',
        issueKey: 'TP-2',
        name: 'Test 2',
        override: { comment: 'TTTT' },
        rules: [{ field: 'categories', op: 'contains', value: 'Training' }]
      },
      {
        accountKey: 'DST20',
        issueKey: 'TP-3',
        name: 'test2',
        override: {},
        rules: []
      }
    ];

    beforeEach(module('exchangeLogController'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('tempoLogService', {
          submit: sinon.stub()
        });
        $provide.value('exchangeService', {
          getExchangeFolder: sinon.stub(),
          getExchangeAppointments: sinon.stub()
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

      exchangeService = $injector.get('exchangeService');

      vm = $controller('ExchangeLogController', { $scope: $scope });
    }));

    it('should load configuration and fetch appointments on configChanged', function() {
      sinon.stub(vm, 'fetchAppointments');

      $scope.$broadcast('configChanged', {
        logTypes: [
          { name: 'A' },
          { name: 'B' }
        ]
      });

      vm.logTypes.should.deep.equal([
        { name: 'Do not log' },
        { name: 'A' },
        { name: 'B' }
      ]);

      vm.appointments.should.be.empty;
      vm.fetchAppointments.should.have.been.calledOnce;
    });

    describe('fetchAppointments', function() {
      it('should fetch appointments', function() {
        sinon.stub(vm, 'matchRules');

        vm.inputDate = new Date();
        exchangeService.getExchangeFolder.returns($q.when('FOLDER'));
        exchangeService.getExchangeAppointments.withArgs('FOLDER', vm.inputDate).returns($q.when(angular.copy(APPOINTMENTS)));

        vm.fetchAppointments();
        $rootScope.$digest();
        
        vm.appointments.should.have.length.of(3);
        vm.appointments[0].should.have.property('itemId', 'ID1');
        vm.appointments[0].should.have.property('subject', 'Test Appointment !');
        vm.appointments[0].should.have.property('start').deep.equal(new Date('2015-11-20T01:00:00.000Z'));
        vm.appointments[0].should.have.property('duration', 1800);
        vm.appointments[0].should.have.property('durationHours', 0.5);
        vm.appointments[0].should.have.property('categories').deep.equal(['Training']);
        vm.appointments[0].should.have.property('myResponseType', 'Organizer');
        
        vm.matchRules.should.have.been.calledOnce;
      });
      it('should display errors if failed with HTTP error', function() {
        vm.appointments = ['a'];

        exchangeService.getExchangeFolder.returns($q.reject({ statusText: 'Test Error' }));

        vm.fetchAppointments();
        $rootScope.$digest();

        vm.error.should.equal('Test Error');
        vm.appointments.should.be.empty;
      });
      it('should display errors if failed with unknown error', function() {
        vm.appointments = ['a'];

        exchangeService.getExchangeFolder.returns($q.reject({}));

        vm.fetchAppointments();
        $rootScope.$digest();

        vm.error.should.equal('Unknown Error');
        vm.appointments.should.be.empty;
      });
    });

    describe('matchRules', function() {
      it('should match', function() {
        mockAppointments();
        vm.matchRules();

        // Match subject
        vm.appointments[1].logType.name.should.equal('Test 1');

        // Match category
        vm.appointments[0].logType.name.should.equal('Test 2');

        // No match
        vm.appointments[2].logType.name.should.equal('Do not log');
      });
    });

    describe('submitExchangeLog', function() {
      it('should submit logs and broadcast result', function() {
        mockAppointments();
        vm.appointments[0].logType = vm.logTypes[1];
        vm.appointments[2].logType = vm.logTypes[2];
        
        vm.submitExchangeLog();
        tempoLogService.submit.should.have.been.calledWithMatch({
          subject: 'Test Appointment !',
          start: new Date('2015-11-20T01:00:00.000Z'),
          logType: { accountKey: 'ATT01', issueKey: 'TP-1', override: { comment: '' } },
          duration: 1800
        });
        tempoLogService.submit.should.have.been.calledWithMatch({
          subject: 'Test Appointment 3',
          start: new Date('2015-11-20T11:00:00.000Z'),
          logType: { accountKey: 'ATT02', issueKey: 'TP-2', override: { comment: 'TTTT' } },
          duration: 1200
        });

      });
    });

    describe('exchangeTotalHours', function() {
      it('should return the total hours to be logged', function() {
        mockAppointments();
        vm.exchangeTotalHours().should.equal(0);

        vm.appointments[0].logType = vm.logTypes[1];
        vm.exchangeTotalHours().should.equal(0.5);

        vm.appointments[2].logType = vm.logTypes[2];
        vm.exchangeTotalHours().should.equal(0.83);
      });
    });

    function mockAppointments() {
      // TODO: This duplicates main code
      vm.appointments = angular.copy(APPOINTMENTS);
      vm.logTypes = [{ name: 'Do not log' }].concat(LOG_TYPES);
      angular.forEach(vm.appointments, function(appointment) {
        appointment.logType = vm.logTypes[0];
        appointment.duration = (appointment.end - appointment.start) / 1000;
      });
    }

  });

})();
