'use strict';

var exchangeLogController = angular.module('exchangeLogController', [
  'exchangeService',
  'tempoLogService',
  'utils'
]);

exchangeLogController.controller('ExchangeLogController', ['$scope', '$rootScope', 'exchangeService', 'tempoLogService', 'utils',
  function($scope, $rootScope, exchangeService, tempoLogService, utils) {
    var vm = this;

    vm.inputDate = new Date();
    vm.appointments = [];

    vm.matchRules = function() {
      angular.forEach(vm.appointments, function(appointment) {
        // Initialize to not match
        appointment.logType = vm.logTypes[0];

        // Try to match each rule
        // TODO: Refactor
        angular.forEach(vm.logTypes, function(logType) {
          angular.forEach(logType.rules, function(rule) {
            var field = appointment[rule.field];
            if (rule.op === 'contains') {
              if (typeof field === 'string') {
                if (field.toLowerCase().includes(rule.value.toLowerCase())) {
                  appointment.logType = logType;
                }
              } else if (typeof field === 'object') {
                // Array
                var lowerCasedField = field.map(function(x) { return x.toLowerCase(); });
                if (lowerCasedField.indexOf(rule.value.toLowerCase()) !== -1) {
                  appointment.logType = logType;
                }
              }
            }
          });
        });
      });
    };

    vm.fetchAppointments = function() {
      var inputDate = vm.inputDate;
      console.log('Fetching appointments for ' + inputDate);
      exchangeService.getExchangeFolder()
        .then(function(exchangeFolder) {
          return exchangeService.getExchangeAppointments(exchangeFolder, inputDate);
        })
        .then(function(appointments) {
          // Calculate duration and add "durationHours"
          angular.forEach(appointments, function(appointment) {
            appointment.duration = (appointment.end - appointment.start) / 1000;

            Object.defineProperty(appointment, 'durationHours', {
              get: function() {
                return parseFloat(utils.secondsToHours(this.duration).toFixed(2));
              },
              set: function(newValue) {
                this.duration = utils.hoursToSeconds(newValue);
              }
            });
          });

          // Populate to scope
          vm.error = undefined;
          vm.appointments = appointments;

          // Auto match rules
          vm.matchRules();
        })
        .catch(function(reason) {
          console.log('Exchange error', reason);

          if (reason.statusText) {
            vm.error = reason.statusText;
          } else {
            vm.error = 'Unknown Error';
          }
          vm.appointments = [];
        });
    };

    vm.submitExchangeLog = function() {
      angular.forEach(vm.appointments, function(appointment) {
        if (appointment.logType.issueKey === undefined) {
          // "Do not log"
          return;
        }

        $rootScope.$broadcast('result', tempoLogService.submit(appointment));
      });
    };

    vm.exchangeTotalHours = function() {
      var total = 0;
      angular.forEach(vm.appointments, function(appointment) {
        if (appointment.logType.issueKey !== undefined) {
          total += appointment.duration;
        }
      });
      return parseFloat(utils.secondsToHours(total).toFixed(2));
    };

    vm.isToday = function() {
      return utils.isSameDay(vm.inputDate, new Date());
    };

    // Init
    $scope.$on('configChanged', function(event, config) {
      vm.logTypes = angular.copy(config.logTypes);
      vm.logTypes.unshift({name: 'Do not log'});

      vm.appointments = [];
      vm.fetchAppointments();
    });

  }]);
