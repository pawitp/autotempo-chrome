'use strict';

var myApp = angular.module('autoTempoApp', [
  'ui.bootstrap',
  'ngQueue',
  'exchangeService',
  'jiraService',
  'configService'
]);

myApp.controller('AppController', ['$scope', '$timeout', '$q', '$queueFactory', '$filter', 'exchangeService', 'jiraService', 'configService',
  function($scope, $timeout, $q, $queueFactory, $filter, exchangeService, jiraService, configService) {
    $scope.exchangeLog = {
      inputDate: new Date(),
      appointments: []
    };

    $scope.configuration = {
      importExport: '',
      config: {},
      status: ''
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
          $scope.exchangeLog.appointments = appointments;
        })
        .catch(function(reason) {
          console.log('Exchange error', reason);

          if (reason.statusText) {
            $scope.exchangeLog.error = reason.statusText;
          } else {
            $scope.exchangeLog.error = 'Unknown Error';
          }
          $scope.exchangeLog.appointments = [];
        });
    };

    function getAccountDescription(issueKey, accountKey) {
      // TODO: Cache result and reuse across issue
      return jiraService.getAccountList(issueKey)
        .then(function(accountList) {
          var found = $filter('filter')(accountList, {key: accountKey}, true);
          if (found.length > 0) {
            return found[0].value;
          } else {
            throw 'Description for account not found';
          }
        });
    }

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

            // Fetch account description (using another promise since we don't want to error out of this fails)
            getAccountDescription(result.issueKey, result.accountKey).then(function(description) {
              result.accountDescription = description;
            });
          })
          .catch(function(error) {
            result.style = 'danger';
            result.status = 'Error';
            if (angular.isObject(error.data)) {
              // TODO: Extract error from JSON
              result.statusTooltip = angular.toJson(error.data, true);
            } else {
              result.statusTooltip = error.statusText;
            }
            console.log('Error submitting work log', error);
          });
      });
    }

    $scope.clearResult = function() {
      $scope.results = [];
    };

    $scope.submitExchangeLog = function() {
      angular.forEach($scope.exchangeLog.appointments, function(appointment) {
        submitTempo(appointment);
      });
    };

    $scope.deleteLogType = function(index) {
      $scope.configuration.config.logTypes.splice(index, 1);
    };

    $scope.addLogType = function() {
      $scope.configuration.config.logTypes.push({});
    };

    function loadConfig(config) {
      $scope.configuration.config = config;
      $scope.logTypes = angular.copy(config.logTypes);
      $scope.logTypes.unshift({name: 'Do not log'});
    }

    $scope.saveConfig = function() {
      configService.saveConfig($scope.configuration.config)
        .then(function(config) {
          loadConfig(config);
          $scope.configuration.status = 'Saved configuration successfully';
          return $timeout(5000);
        })
        .then(function() {
          $scope.configuration.status = '';
        });
    };

    $scope.importConfig = function() {
      var newConfig = JSON.parse($scope.configuration.importExport);

      // Preserve username and password
      newConfig.exchange.username = $scope.configuration.config.exchange.username;
      newConfig.exchange.password = $scope.configuration.config.exchange.password;
      newConfig.jira.username = $scope.configuration.config.jira.username;
      newConfig.jira.password = $scope.configuration.config.jira.password;

      $scope.configuration.config = newConfig;
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
