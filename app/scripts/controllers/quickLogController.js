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
      vm.durationHours = 0;
    }

    vm.overrideComment = function(comment) {
      if (comment) {
        vm.comment = comment;
        vm.commentReadOnly = true;
      } else {
        vm.commentReadOnly = false;
      }
    };

    vm.submitQuickLog = function() {
      var duration = utils.hoursToSeconds(vm.durationHours);

      var result = tempoLogService.submit(vm.date, duration, vm.comment, vm.logType.issueKey, vm.logType.accountKey);
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
