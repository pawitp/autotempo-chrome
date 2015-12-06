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

    // TODO: Move "config" in here
    $scope.configuration = {
      importExport: ''
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

    function submitTempo(appointments) {
      var submitQueue = [];

      angular.forEach(appointments, function(appointment) {
        // TODO: We need to queue appointments from different submission as well

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
    }

    $scope.submitExchangeLog = function() {
      submitTempo($scope.appointments);
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
        date: new Date(),
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

      submitTempo([appointment]);
      clearQuickLog();
    };

    // Init
    configService.initConfig().then(function(config) {
      loadConfig(config);
      $scope.fetchAppointments();
      clearQuickLog();
    });

  }]);
