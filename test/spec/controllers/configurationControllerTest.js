/*jshint expr: true*/
(function() {
  'use strict';

  describe('configurationController', function() {

    var vm, $scope, $rootScope, $q, $uibModal, configService;

    beforeEach(module('configurationController'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('configService', {
          initConfig: sinon.stub(),
          saveConfig: sinon.stub()
        });
        $provide.value('$uibModal', {
          open: sinon.stub()
        });
      });
    });

    beforeEach(inject(function($controller, $injector) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $q = $injector.get('$q');

      configService = $injector.get('configService');
      configService.initConfig.returns($q.when({
        logTypes: []
      }));
      configService.saveConfig.returns($q.when({
        logTypes: ['aa', 'bb', 'cc']
      }));

      $uibModal = $injector.get('$uibModal');

      vm = $controller('ConfigurationController', { $scope: $scope });
      vm.configForm = {
        $dirty: false,
        $setPristine: function() { vm.configForm.$dirty = false; }
      };
      $rootScope.$digest();
    }));

    it('should load configuration on start', function() {
      configService.initConfig.should.have.been.calledOnce;
      vm.config.should.deep.equal({
        logTypes: []
      });
    });

    it('should should open modal on close if form is dirty and save if selected', function() {
      vm.configForm.$dirty = true;
      $uibModal.open.returns({
        result: $q.when()
      });

      $scope.$broadcast('configClosed');
      $rootScope.$digest();

      configService.saveConfig.should.have.been.calledOnce;
    });

    it('should should open modal on close if form is dirty and not save if not selected', function() {
      vm.configForm.$dirty = true;
      sinon.spy(vm, 'resetConfig');
      $uibModal.open.returns({
        result: $q.reject()
      });

      $scope.$broadcast('configClosed');
      $rootScope.$digest();

      configService.saveConfig.should.not.have.been.called;
      vm.resetConfig.should.have.been.called;
    });

    it('should should not open modal on close if form is pristine', function() {
      vm.configForm.$dirty = false;

      $scope.$broadcast('configClosed');

      $uibModal.open.should.not.have.been.called;
    });
    
    describe('saveConfig', function() {
      it('should save the configuration using configService', function() {
        vm.config = {
          logTypes: ['bbb']
        };
        vm.saveConfig();
        configService.saveConfig.should.have.been.calledWith(vm.config);
      });
      it('should load the saved configuration', function() {
        vm.saveConfig();
        $rootScope.$digest();
        vm.config.logTypes.should.deep.equal(['aa', 'bb', 'cc']);
      });
    });

    describe('resetConfig', function() {
      it('should load config from config service', function() {
        vm.config = {
          logTypes: ['bbb']
        };
        vm.resetConfig();
        $rootScope.$digest();
        vm.config.logTypes.should.deep.equal([]);
      });
      it('should mark the form as pristine', function() {
        vm.configForm.$dirty = true;
        vm.resetConfig();
        $rootScope.$digest();
        vm.configForm.$dirty.should.be.false;
      });
    });

    describe('importConfig', function() {
      it('should import configuration except username or password', function() {
        vm.config = {
          exchange: {
            username: 'euser',
            password: 'epass'
          },
          jira: {
            username: 'user',
            password: 'pass'
          },
          logTypes: ['d', 'e', 'f']
        };

        vm.importExport = '{"exchange":{"url":"http://ex/"},"jira":{"url":"http://jira/"},"logTypes":["a","b","c"]}';
        vm.importConfig();

        vm.config.should.deep.equal({
          exchange: {
            url: 'http://ex/',
            spnego: undefined,
            username: 'euser',
            password: 'epass'
          },
          jira: {
            url: 'http://jira/',
            spnego: undefined,
            username: 'user',
            password: 'pass'
          },
          logTypes: ['a', 'b', 'c']
        });
      });
    });

    describe('exportConfig', function() {
      it('should export configuration without username or password', function() {
        configService.initConfig.returns($q.when({
          exchange: {
            spnego: false,
            url: 'http://ex/',
            username: 'euser',
            password: 'epass'
          },
          jira: {
            spnego: false,
            url: 'http://jira/',
            username: 'user',
            password: 'pass'
          },
          logTypes: ['a', 'b', 'c']
        }));

        vm.exportConfig();
        $rootScope.$digest();
        vm.importExport.should.equal('{"exchange":{"url":"http://ex/"},"jira":{"url":"http://jira/"},"logTypes":["a","b","c"]}');
      });
    });

    describe('addLogType', function() {
      it('should add a new log type to the end of the list', function() {
        vm.addLogType();
        vm.config.logTypes.should.deep.equal([{ rules: [] }]);
      });
    });

    describe('deleteLogType', function() {
      it('should delete the log type at the specified index', function() {
        vm.config.logTypes = ['a', 'b', 'c', 'd'];
        vm.deleteLogType(2);
        vm.config.logTypes.should.deep.equal(['a', 'b', 'd']);
      });
    });

    describe('addRule', function() {
      it('should add a new rule to the end of the list', function() {
        var rules = [];
        vm.addRule(rules);
        rules.should.deep.equal([{}]);
      });
    });

    describe('deleteRule', function() {
      it('should delete the rule at the specified index', function() {
        var rules = ['a', 'b', 'c'];
        vm.deleteRule(rules, 1);
        rules.should.deep.equal(['a', 'c']);
      });
    });

  });

})();
