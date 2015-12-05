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

  return service;
});
