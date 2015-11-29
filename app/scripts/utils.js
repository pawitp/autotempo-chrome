'use strict';

var utils = angular.module('utils', []);

utils.factory('utils', function() {

  var service = {};

  service.getHttpHeaders = function(contentType, username, password) {
    var headers = {
      'Content-Type': contentType
    };

    if (username || password) {
      headers.Authorization = 'Basic ' + window.btoa(username + ':' + password);
    }

    return headers;
  };

  return service;
});
