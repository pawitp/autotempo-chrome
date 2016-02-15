'use strict';

var quickLogController = angular.module('quickLogController', [
  'ui.bootstrap',
  'tempoLogService',
  'utils'
]);

quickLogController.controller('QuickLogController', ['$scope', '$rootScope', 'tempoLogService', 'utils',
  function($scope, $rootScope, tempoLogService, utils) {
    var vm = this;
    vm.date = new Date();

    function clearQuickLog() {
      vm.logType = vm.logTypes[0];
      vm.applyLogType(vm.logType);
      vm.durationHours = 0;
      vm.comment = '';
    }

    vm.applyLogType = function(logType) {
      vm.issueKey = logType.issueKey;
      vm.accountKey = logType.accountKey;

      if (logType.override && logType.override.comment) {
        vm.comment = logType.override.comment;
      }
    };

    vm.submitQuickLog = function() {
      var duration = utils.hoursToSeconds(vm.durationHours);

      var result = tempoLogService.submit(vm.date, duration, vm.comment, vm.issueKey, vm.accountKey);
      $rootScope.$broadcast('result', result);
      clearQuickLog();
    };

    vm.isToday = function() {
      return utils.isSameDay(vm.date, new Date());
    };

    $scope.$on('configChanged', function(event, config) {
      vm.logTypes = angular.copy(config.logTypes);
      vm.logTypes.unshift({name: 'Do not log'});

      clearQuickLog();
    });

  }]);
