'use strict';

var myApp = angular.module('autoTempoApp', [
  'exchangeService',
  'jiraService',
  'configService'
]);

myApp.controller('AppController', ['$scope', '$timeout', 'exchangeService', 'jiraService', 'configService',
  function($scope, $timeout, exchangeService, jiraService, configService) {
    $scope.inputDate = new Date();
    $scope.results = [];

    $scope.fetchAppointments = function() {
      console.log('Fetching appointments for ' + $scope.inputDate);
      // TODO: error handling
      exchangeService.getExchangeFolder()
        .then(function(exchangeFolder) {
          return exchangeService.getExchangeAppointments(exchangeFolder, $scope.inputDate);
        })
        .then(function(appointments) {
          $scope.appointments = appointments;
        });
    };

    $scope.submitTempo = function() {
      console.log('Submitting to tempo');

      angular.forEach($scope.appointments, function(appointment) {
        if (appointment.logType.issueKey === null) {
          // "Do not log"
          return;
        }

        var result = {
          subject: appointment.subject,
          issueKey: appointment.logType.issueKey,
          accountKey: appointment.logType.accountKey,
          duration: appointment.end - appointment.start,
          status: 'Processing'
        };

        $scope.results.push(result);

        jiraService.submitTempo(appointment)
          .then(function(response) {
            result.response = response; // TODO: show time left
            result.status = 'Success';
          })
          .catch(function(error) {
            result.status = 'Error: ' + error;
          });
      });
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
