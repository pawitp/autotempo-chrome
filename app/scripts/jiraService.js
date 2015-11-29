'use strict';

var jiraService = angular.module('jiraService', ['base64', 'configService']);

jiraService.factory('jiraService', ['$http', '$q', '$base64', 'configService',
  function($http, $q, $base64, configService) {

    var REST_WORKLOG_PATH = 'rest/tempo-timesheets/3/worklogs/';
    var REST_ISSUE_TIMETRACKING_PATH = 'rest/api/2/issue/{{ issueKey }}?fields=timetracking';

    function getJiraHeaders() {
      var credentials = $base64.encode(configService.getJiraUsername() + ':' + configService.getJiraPassword());
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + credentials
      };
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

    function createWorklog(appointment, existingEstimate) {
      var workLog = {
        dateStarted: formatDate(appointment.start),
        timeSpentSeconds: Math.floor((appointment.end - appointment.start) / 1000),
        comment: appointment.subject,
        author: {
          name: configService.getJiraUsername()
        },
        issue: {
          key: appointment.logType.issueKey
        },
        worklogAttributes: [
          {key: '_Account_', value: appointment.logType.accountKey}
        ]
      };

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

    return service;
  }]);
