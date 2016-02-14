'use strict';

var jiraService = angular.module('jiraService', ['utils', 'configService']);

jiraService.factory('jiraService', ['$http', '$q', 'utils', 'configService',
  function($http, $q, utils, configService) {

    var REST_WORKLOG_PATH = 'rest/tempo-timesheets/3/worklogs/';
    var REST_ISSUE_TIMETRACKING_PATH = 'rest/api/2/issue/{{ issueKey }}?fields=timetracking';
    var REST_ACCOUNT_PATH = 'rest/tempo-rest/1.0/accounts/json/billingKeyList/{{ issueKey }}?callback=fn';

    function getJiraHeaders() {
      return utils.getHttpHeaders('application/json', configService.getJiraCredentials());
    }

    function getRemainingEstimate(issueKey) {
      return $http.get(configService.getJiraUrl() + REST_ISSUE_TIMETRACKING_PATH.replace('{{ issueKey }}', issueKey), {
        headers: getJiraHeaders()
      }).then(function successCallback(response) {
        return response.data.fields.timetracking.remainingEstimateSeconds;
      }, function errorCallback(reason) {
        if (reason.status === 403) {
          // We might not have the right to view internal issues
          // In this case, just use no time estimate, since internal issues
          // do not require estimates
          return null;
        } else {
          return $q.reject(reason);
        }
      });
    }

    function padNumber(number) {
      return (number < 10 ? '0' : '') + number;
    }

    // Tempo operates in local timezone, which may not match our local timezone,
    // but we want to log in such a way that the date matches the server's timezone.
    // So send only the local date, without the timezone.
    // (Thus, we cannot use toISOString() because that uses UTC time)
    function formatDate(date) {
      return date.getFullYear() +
          '-' + padNumber(date.getMonth() + 1) +
          '-' + padNumber(date.getDate()) +
          'T' + padNumber(date.getHours()) +
          ':' + padNumber(date.getMinutes()) +
          ':' + padNumber(date.getSeconds());
    }

    // Some private API of Tempo uses JSONP
    function parseJsonp(jsonp) {
      // Assume JSONP starts with "fn(" (default for Tempo)
      return angular.fromJson(jsonp.substring(3, jsonp.length - 1));
    }

    function createWorklog(appointment, existingEstimate) {
      var workLog = {
        dateStarted: formatDate(appointment.start),
        timeSpentSeconds: appointment.duration,
        comment: appointment.subject,
        author: {
          name: configService.getJiraCredentials().username
        },
        issue: {
          key: appointment.logType.issueKey
        },
        worklogAttributes: [
          {key: '_Account_', value: appointment.logType.accountKey}
        ]
      };

      // Merge in overrides
      if (appointment.logType.override) {
        if (appointment.logType.override.comment) {
          workLog.comment = appointment.logType.override.comment;
        }
      }

      if (existingEstimate !== null) {
        var newEstimate = existingEstimate - workLog.timeSpentSeconds;
        if (newEstimate < 0) {
          newEstimate = 0;
        }

        workLog.issue.remainingEstimateSeconds = newEstimate;
      }

      return $http.post(configService.getJiraUrl() + REST_WORKLOG_PATH, workLog, {
        headers: getJiraHeaders()
      });
    }

    var service = {};

    service.submitTempo = function(appointment) {
      return getRemainingEstimate(appointment.logType.issueKey)
        .then(createWorklog.bind(null, appointment));
    };

    service.getAccountList = function(issueKey) {
      return $http.get(configService.getJiraUrl() + REST_ACCOUNT_PATH.replace('{{ issueKey }}', issueKey), {
        headers: getJiraHeaders()
      }).then(function successCallback(response) {
        return parseJsonp(response.data).values;
      });
    };

    return service;
  }]);