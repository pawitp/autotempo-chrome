'use strict';

var utils = angular.module('utils', []);

utils.factory('utils', function() {

  var service = {};

  service.getHttpHeaders = function(contentType, credentials) {
    var headers = {
      'Content-Type': contentType
    };

    if (!credentials.spnego) {
      headers.Authorization = 'Basic ' + window.btoa(credentials.username + ':' + credentials.password);
    }

    return headers;
  };

  service.secondsToHours = function(seconds) {
    return seconds / 3600;
  };

  service.hoursToSeconds = function(hours) {
    // Get rounded minutes first (no point logging with sub-minutes precision)
    var minutes = Math.round(hours * 60);
    return minutes * 60;
  };

  service.isSameDay = function(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  return service;
});
