'use strict';

var myApp = angular.module('autoTempoApp', [
  'ui.bootstrap',
  'ngQueue',
  'exchangeService',
  'jiraService',
  'configService'
]);

myApp.controller('AppController', ['$scope', '$timeout', '$q', '$queueFactory', '$cacheFactory', '$uibModal', 'exchangeService', 'jiraService', 'configService',
  function($scope, $timeout, $q, $queueFactory, $cacheFactory, $uibModal, exchangeService, jiraService, configService) {
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

    function matchRules(appointments, logTypes) {
      angular.forEach(appointments, function(appointment) {
        // Initialize to not match
        appointment.logType = logTypes[0];

        // Try to match each rule
        // TODO: Refactor
        angular.forEach(logTypes, function(logType) {
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
                if (lowerCasedField.includes(rule.value.toLowerCase())) {
                  appointment.logType = logType;
                }
              }
            }
          });
        });
      });
    }

    $scope.fetchAppointments = function() {
      var inputDate = $scope.exchangeLog.inputDate;
      console.log('Fetching appointments for ' + inputDate);
      exchangeService.getExchangeFolder()
        .then(function(exchangeFolder) {
          return exchangeService.getExchangeAppointments(exchangeFolder, inputDate);
        })
        .then(function(appointments) {
          matchRules(appointments, $scope.logTypes);
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

    var accountCache = $cacheFactory('accountCache');

    function getAccountDescription(issueKey, accountKey) {
      var cachedDescription = accountCache.get(accountKey);
      if (cachedDescription) {
        return $q.when(cachedDescription);
      } else {
        return jiraService.getAccountList(issueKey)
          .then(function(accountList) {
            angular.forEach(accountList, function(account) {
              accountCache.put(account.key, account.value);
            });
            return accountCache.get(accountKey);
          });
      }
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

    $scope.deleteRule = function(rules, index) {
      rules.splice(index, 1);
    };

    $scope.addRule = function(rules) {
      rules.push({});
    };

    function loadConfig(config) {
      $scope.configuration.config = config;
      $scope.configuration.configForm.$setPristine();
      $scope.logTypes = angular.copy(config.logTypes);
      $scope.logTypes.unshift({name: 'Do not log'});
    }

    $scope.saveConfig = function() {
      configService.saveConfig($scope.configuration.config)
        .then(function(config) {
          loadConfig(config);

          // Workaround for issue where if accountKey/issueKey is changed
          // without adding or removing an issue, the accountKey/issueKey
          // will not be updated in the already selected appointment.
          // (So just reset the state when we save)
          // TODO: Fix or move this into loadConfig to reuse code when we initialize the app
          clearQuickLog();
          $scope.exchangeLog.appointments = [];
          $scope.fetchAppointments();
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

    $scope.warnDirtyConfig = function() {
      if ($scope.configuration.configForm.$dirty) {
        var modalInstance = $uibModal.open({
          templateUrl: 'warnDirtyConfig.html',
          controller: 'WarnDirtyConfigCtrl',
          backdrop: 'static'
        });

        modalInstance.result.then(function() {
          // Save
          $scope.saveConfig();
        }, function () {
          // Not saved
          console.log('Configuration not saved');
        });
      }
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

myApp.controller('WarnDirtyConfigCtrl', ['$scope', '$uibModalInstance',
  function($scope, $uibModalInstance) {

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

  }]);