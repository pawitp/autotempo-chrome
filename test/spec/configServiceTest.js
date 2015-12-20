/*jshint expr: true*/
(function() {
  'use strict';

  describe('configService', function() {

    beforeEach(module('configService'));

    describe('initConfig', function() {
      it('should load existing configuration from local storage');
      it('should create empty structure from config');
      it('should full in any blank field in logType');
    });

    describe('saveConfig', function() {
      it('should append "/" to URLs if it does not end in "/"');
      it('should not append "/" to URLs if it ends in "/"');
      it('should prepend "http://" to URLs if does not have a protocol');
      it('should not prepend "http://" to URLs if it starts with "http://"');
      it('should not prepend "http://" to URLs if it starts with "https://"');
      it('should save configuration in local storage');
    });

    describe('getExchangeUrl', function() {
      it('should return configured Exchange URL');
    });

    describe('getExchangeCredentials', function() {
      it('should return configured Exchange credentials');
    });

    describe('getJiraUrl', function() {
      it('should return configured JIRA URL');
    });

    describe('getJiraCredentials', function() {
      it('should return configured JIRA credentials');
    });

  });

})();
