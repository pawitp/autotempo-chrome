'use strict';

var myApp = angular.module('autoTempoApp', [
  'ui.bootstrap',
  'ngQueue',
  'exchangeService',
  'jiraService',
  'configService'
]);

myApp.controller('AppController', ['$scope', '$timeout', '$q', '$queueFactory', 'exchangeService', 'jiraService', 'configService',
  function($scope, $timeout, $q, $queueFactory, exchangeService, jiraService, configService) {
    // TODO: Move "appointments" in here as well
    $scope.exchangeLog = {
      inputDate: new Date()
    };

    // TODO: Move "config" in here
    $scope.configuration = {
      importExport: ''
    };

    $scope.results = [];

    $scope.fetchAppointments = function() {
      var inputDate = $scope.exchangeLog.inputDate;
      console.log('Fetching appointments for ' + inputDate);
      exchangeService.getExchangeFolder()
        .then(function(exchangeFolder) {
          return exchangeService.getExchangeAppointments(exchangeFolder, inputDate);
        })
        .then(function(appointments) {
          $scope.exchangeLog.error = undefined;
          $scope.appointments = appointments;
        })
        .catch(function(reason) {
          console.log('Exchange error', reason);

          if (reason.statusText) {
            $scope.exchangeLog.error = reason.statusText;
          } else {
            $scope.exchangeLog.error = 'Unknown Error';
          }
          $scope.appointments = [];
        });
    };

    var submitQueue = $queueFactory(1, true);

    function submitTempo(appointment) {
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

      $scope.results.unshift(result);

      // Use queue to log one-by-one to prevent wrong estimates and reduce load on server
      submitQueue.enqueue(function() {
        result.style = 'warning';
        result.status = 'Processing';

        return jiraService.submitTempo(appointment)
          .then(function(response) {
            result.response = response.data;
            result.style = 'success';
            result.status = 'Success';
          })
          .catch(function(error) {
            result.style = 'danger';
            result.status = 'Error';
            console.log('Error submitting work log', error);
          });
      });
    }

    $scope.clearResult = function() {
      $scope.results = [];
    };

    $scope.submitExchangeLog = function() {
      angular.forEach($scope.appointments, function(appointment) {
        submitTempo(appointment);
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

    $scope.importConfig = function() {
      var newConfig = JSON.parse($scope.configuration.importExport);

      // Preserve username and password
      newConfig.exchange.username = $scope.config.exchange.username;
      newConfig.exchange.password = $scope.config.exchange.password;
      newConfig.jira.username = $scope.config.jira.username;
      newConfig.jira.password = $scope.config.jira.password;

      $scope.saveConfig();
    };

    $scope.exportConfig = function() {
      configService.initConfig().then(function(config) {
        // Clean out username and password
        config.exchange.username = undefined;
        config.exchange.password = undefined;
        config.jira.username = undefined;
        config.jira.password = undefined;

        $scope.configuration.importExport = JSON.stringify(config);
      });
    };

    function clearQuickLog() {
      $scope.quickLog = {
        date: angular.isDefined($scope.quickLog) ? $scope.quickLog.date : new Date(),
        logType: $scope.logTypes[0],
        durationHours: 0
      };
    }

    $scope.quickLogOverrideComment = function(comment) {
      if (comment) {
        $scope.quickLog.comment = comment;
        $scope.quickLog.commentReadOnly = true;
      } else {
        $scope.quickLog.commentReadOnly = false;
      }
    };

    function addSeconds(date, seconds) {
      var newDate = new Date(date);
      newDate.setSeconds(newDate.getSeconds() + seconds);
      return newDate;
    }

    $scope.submitQuickLog = function() {
      var quickLog = $scope.quickLog;

      // Create "appointment" from quick log
      var appointment = {
        start: quickLog.date,
        end: addSeconds(quickLog.date, quickLog.durationHours * 3600),
        subject: quickLog.comment,
        logType: quickLog.logType
      };

      submitTempo(appointment);
      clearQuickLog();
    };

    // Init
    configService.initConfig().then(function(config) {
      loadConfig(config);
      $scope.fetchAppointments();
      clearQuickLog();
    });

  }]);
