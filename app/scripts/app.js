'use strict';

var myApp = angular.module('autoTempoApp', [
  'ui.bootstrap',
  'exchangeService',
  'jiraService',
  'configService'
]);

myApp.controller('AppController', ['$scope', '$timeout', '$q', 'exchangeService', 'jiraService', 'configService',
  function($scope, $timeout, $q, exchangeService, jiraService, configService) {
    // TODO: Move "appointments" in here as well
    $scope.exchangeLog = {
      inputDate: new Date()
    };

    $scope.results = [];

    $scope.fetchAppointments = function() {
      var inputDate = $scope.exchangeLog.inputDate;
      console.log('Fetching appointments for ' + inputDate);
      // TODO: error handling
      exchangeService.getExchangeFolder()
        .then(function(exchangeFolder) {
          return exchangeService.getExchangeAppointments(exchangeFolder, inputDate);
        })
        .then(function(appointments) {
          $scope.appointments = appointments;
        });
    };

    $scope.submitTempo = function() {
      console.log('Submitting to tempo');

      var submitQueue = [];

      angular.forEach($scope.appointments, function(appointment) {
        if (appointment.logType.issueKey === undefined) {
          // "Do not log"
          return;
        }

        var result = {
          subject: appointment.subject,
          issueKey: appointment.logType.issueKey,
          accountKey: appointment.logType.accountKey,
          duration: appointment.end - appointment.start,
          status: 'Queued'
        };

        $scope.results.push(result);
        submitQueue.push([appointment, result]);
      });

      // Use arr.reduce to log one-by-one to prevent wrong estimates and reduce load on server
      submitQueue.reduce(function(promise, workItem) {
        return promise.then(function() {
          var appointment = workItem[0];
          var result = workItem[1];

          result.status = 'Processing';

          return jiraService.submitTempo(appointment)
            .then(function(response) {
              result.response = response; // TODO: show time left
              result.status = 'Success';
            })
            .catch(function(error) {
              result.status = 'Error';
              console.log('Error submitting work log', error);
            });
        });
      }, $q.when());
    };

    $scope.deleteLogType = function(index) {
      $scope.config.logTypes.splice(index, 1);
    };

    $scope.addLogType = function() {
      $scope.config.logTypes.push({});
    };

    function loadConfig(config) {
      $scope.config = config;
      $scope.logTypes = angular.copy(config.logTypes);
      $scope.logTypes.unshift({name: 'Do not log'});
    }

    $scope.saveConfig = function() {
      configService.saveConfig($scope.config)
        .then(function(config) {
          loadConfig(config);
          $scope.configStatus = 'Saved configuration successfully';
          return $timeout(5000);
        })
        .then(function() {
          $scope.configStatus = '';
        });
    };

    // Init
    configService.initConfig().then(function(config) {
      loadConfig(config);
      $scope.fetchAppointments();
    });

  }]);
