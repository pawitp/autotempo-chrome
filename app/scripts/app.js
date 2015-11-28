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

    // Mock
    $scope.logTypes = [
      {id: 0, name: 'Do not log '},
      {id: 1, name: 'Daily', issueKey: 'TP-1', accountKey: 'ATT01'},
      {id: 2, name: 'General Meeting', issueKey: 'TP-2', accountKey: 'ATT02'},
      {id: 3, name: 'Grooming', issueKey: 'TP-3', accountKey: 'ATT03'}
    ];

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
        if (appointment.logType.id === 0) {
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

    $scope.saveConfig = function() {
      configService.saveConfig($scope.config)
        .then(function() {
          $scope.configStatus = 'Saved configuration successfully';
          return $timeout(5000);
        })
        .then(function() {
          $scope.configStatus = '';
        });
    };

    // Init
    configService.initConfig().then(function(config) {
      $scope.config = config;
      $scope.fetchAppointments();
    });

  }]);
