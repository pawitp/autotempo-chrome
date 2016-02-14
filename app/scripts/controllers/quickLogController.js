'use strict';

var quickLogController = angular.module('quickLogController', [
  'ui.bootstrap',
  'tempoLogService',
  'utils'
]);

quickLogController.controller('QuickLogController', ['$scope', '$rootScope', 'tempoLogService', 'utils',
  function($scope, $rootScope, tempoLogService, utils) {
    var vm = this;

    function clearQuickLog() {
      vm.date = angular.isDefined(vm.date) ? vm.date : new Date();
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
      // Create "appointment" from quick log
      var appointment = {
        start: vm.date,
        duration: utils.hoursToSeconds(vm.durationHours),
        subject: vm.comment,
        logType: vm.logType
      };

      $rootScope.$broadcast('result', tempoLogService.submit(appointment));
      clearQuickLog();
    };

    $scope.$on('configChanged', function(event, config) {
      vm.logTypes = angular.copy(config.logTypes);
      vm.logTypes.unshift({name: 'Do not log'});

      clearQuickLog();
    });

  }]);
