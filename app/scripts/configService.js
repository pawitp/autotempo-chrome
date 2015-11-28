'use strict';

var configService = angular.module('configService', []);

configService.factory('configService', ['$q', function($q) {
  /**
   * Internal configuration used for get methods.
   */
  var config;

  var service = {};

  /**
   * Load config from chrome store. Should only be called once when initializing
   * @returns promise for copy of config for use in the configuration page
   */
  service.initConfig = function() {
    var deferred = $q.defer();

    chrome.storage.local.get('config', function(data) {
      config = data.config;

      // TODO: initialize structure

      // Return copy for use in UI
      deferred.resolve(angular.copy(config));
    });

    return deferred.promise;
  };

  /**
   * Validate configuration and save it into the chorme data store
   * @param newConfig configuration to save
   * @returns promise
   */
  service.saveConfig = function(newConfig) {
    var deferred = $q.defer();

    // TODO: Make sure URLs end with '/'
    chrome.storage.local.set({config: newConfig}, deferred.resolve);

    config = angular.copy(newConfig);

    return deferred.promise;
  };

  service.getExchangeUrl = function() {
    return config.exchange.url;
  };

  service.getExchangeUsername = function() {
    return config.exchange.username;
  };

  service.getExchangePassword = function() {
    return config.exchange.password;
  };

  service.getJiraUrl = function() {
    return config.jira.url;
  };

  service.getJiraUsername = function() {
    return config.jira.username;
  };

  service.getJiraPassword = function() {
    return config.jira.password;
  };

  return service;
}]);
