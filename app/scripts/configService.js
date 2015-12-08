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
      // Create template (for initial setup)
      config = {
        exchange: {
          url: '',
          username: '',
          password: ''
        },
        jira: {
          url: '',
          username: '',
          password: ''
        },
        logTypes: []
      };

      // Merge with loaded config
      angular.merge(config, data.config);

      // Return copy for use in UI
      deferred.resolve(angular.copy(config));
    });

    return deferred.promise;
  };

  function fixUrl(url) {
    // Prepend protocol if not specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    // Append '/' if not present
    if (!url.endsWith('/')) {
      url += '/';
    }

    return url;
  }

  /**
   * Validate configuration and save it into the chrome data store
   * @param newConfig configuration to save
   * @returns promise
   */
  service.saveConfig = function(newConfig) {
    var deferred = $q.defer();

    // Fix URLs format
    newConfig.exchange.url = fixUrl(newConfig.exchange.url);
    newConfig.jira.url = fixUrl(newConfig.jira.url);

    // TODO: Check for presence of issueKey and accountKey

    chrome.storage.local.set({config: newConfig}, function() {
      config = angular.copy(newConfig);
      deferred.resolve(config);
    });

    return deferred.promise;
  };

  service.getExchangeUrl = function() {
    return config.exchange.url;
  };

  service.getExchangeCredentials = function() {
    return {
      username: config.exchange.username,
      password: config.exchange.password,
      spnego: config.exchange.spnego
    };
  };

  service.getJiraUrl = function() {
    return config.jira.url;
  };

  service.getJiraCredentials = function() {
    return {
      username: config.jira.username,
      password: config.jira.password,
      spnego: config.jira.spnego
    };
  };

  return service;
}]);
