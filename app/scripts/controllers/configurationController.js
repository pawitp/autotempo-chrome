'use strict';

var configurationController = angular.module('configurationController', [
  'ui.bootstrap',
  'configService',
]);

configurationController.controller('ConfigurationController', ['$rootScope', '$scope', '$uibModal', 'configService',
  function($rootScope, $scope, $uibModal, configService) {
    var vm = this;

    vm.importExport = '';
    vm.config = {};

    vm.deleteLogType = function(index) {
      vm.config.logTypes.splice(index, 1);
    };

    vm.addLogType = function() {
      vm.config.logTypes.push({ rules: [] });
    };

    vm.deleteRule = function(rules, index) {
      rules.splice(index, 1);
    };

    vm.addRule = function(rules) {
      rules.push({});
    };

    function loadConfig(config) {
      vm.config = config;
      vm.configForm.$setPristine();
      $rootScope.$broadcast('configChanged', config);
    }

    vm.saveConfig = function() {
      configService.saveConfig(vm.config)
        .then(loadConfig);
    };

    vm.resetConfig = function() {
      configService.initConfig().then(function(config) {
        vm.config = config;
        vm.configForm.$setPristine();
      });
    };

    vm.importConfig = function() {
      var newConfig = JSON.parse(vm.importExport);

      // Preserve username and password
      newConfig.exchange.spnego = vm.config.exchange.spnego;
      newConfig.exchange.username = vm.config.exchange.username;
      newConfig.exchange.password = vm.config.exchange.password;
      newConfig.jira.spnego = vm.config.jira.spnego;
      newConfig.jira.username = vm.config.jira.username;
      newConfig.jira.password = vm.config.jira.password;

      vm.config = newConfig;
      vm.saveConfig();
    };

    vm.exportConfig = function() {
      configService.initConfig().then(function(config) {
        // Clean out username and password
        config.exchange.spnego = undefined;
        config.exchange.username = undefined;
        config.exchange.password = undefined;
        config.jira.spnego = undefined;
        config.jira.username = undefined;
        config.jira.password = undefined;

        vm.importExport = JSON.stringify(config);
      });
    };

    $scope.$on('configClosed', function() {
      if (vm.configForm.$dirty) {
        var modalInstance = $uibModal.open({
          templateUrl: 'warnDirtyConfig.html',
          controller: 'WarnDirtyConfigCtrl',
          backdrop: 'static'
        });

        modalInstance.result.then(function() {
          // Save
          vm.saveConfig();
        }, function () {
          // Not saved - reset values on config page
          console.log('Configuration not saved');
          vm.resetConfig();
        });
      }
    });

    configService.initConfig().then(loadConfig);
  }]);

configurationController.controller('WarnDirtyConfigCtrl', ['$scope', '$uibModalInstance',
  function($scope, $uibModalInstance) {

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

  }]);