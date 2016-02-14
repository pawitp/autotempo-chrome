/*jshint expr: true*/
(function() {
  'use strict';

  describe('configService', function() {

    var configService, $rootScope, $q;

    beforeEach(module('configService'));

    beforeEach(inject(function($injector) {
      configService = $injector.get('configService');
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
    }));

    beforeEach(function() {
      // Initialize stub storage
      chrome.storage = {
        local: {
          get: sinon.stub(),
          set: sinon.stub()
        }
      };

      // Mock set callback
      chrome.storage.local.set.yields();
    });

    describe('initConfig', function() {
      it('should load existing configuration from local storage', function(done) {
        mockLocalStorage({
          test: 'test1'
        });

        var config = configService.initConfig();
        config.should.eventually.have.property('test', 'test1').and.notify(done);

        $rootScope.$apply();
      });

      it('should create empty structure from config', function(done) {
        mockLocalStorage({});

        var config = configService.initConfig();
        $q.all([
          config.should.eventually.have.deep.property('exchange.url', ''),
          config.should.eventually.have.deep.property('exchange.username', ''),
          config.should.eventually.have.deep.property('exchange.password', ''),
          config.should.eventually.have.deep.property('jira.url', ''),
          config.should.eventually.have.deep.property('jira.username', ''),
          config.should.eventually.have.deep.property('jira.password', ''),
          config.should.eventually.have.property('logTypes').with.length.of(0)
        ]).should.notify(done);

        $rootScope.$apply();
      });

      it('should full in any blank field in logType', function(done) {
        mockLocalStorage({
          logTypes: [{}]
        });

        var config = configService.initConfig();
        $q.all([
          config.should.eventually.have.deep.property('logTypes[0].name', ''),
          config.should.eventually.have.deep.property('logTypes[0].issueKey', ''),
          config.should.eventually.have.deep.property('logTypes[0].accountKey', ''),
          config.should.eventually.have.deep.property('logTypes[0].override').deep.equal({}),
          config.should.eventually.have.deep.property('logTypes[0].rules').with.length.of(0)
        ]).should.notify(done);

        $rootScope.$apply();
      });
    });

    describe('saveConfig', function() {
      it('should save configuration in local storage', function() {
        configService.saveConfig({
          exchange: { url: '' },
          jira: { url: '' }
        });

        chrome.storage.local.set.should.have.been.called;
      });

      it('should append "/" to URLs if it does not end in "/"', function() {
        configService.saveConfig({
          exchange: { url: 'https://mail.example.com' },
          jira: { url: 'http://jira.example.com' }
        });

        chrome.storage.local.set.should.have.been.calledWith({
          config: {
            exchange: { url: 'https://mail.example.com/' },
            jira: { url: 'http://jira.example.com/' }
          }
        });
      });

      it('should prepend "http://" to URLs if does not have a protocol', function() {
        configService.saveConfig({
          exchange: { url: 'mail.example.com/' },
          jira: { url: 'jira.example.com/' }
        });

        chrome.storage.local.set.should.have.been.calledWith({
          config: {
            exchange: { url: 'http://mail.example.com/' },
            jira: { url: 'http://jira.example.com/' }
          }
        });
      });

      it('should not modify URLs if they are already correct', function() {
        configService.saveConfig({
          exchange: { url: 'https://mail.example.com/' },
          jira: { url: 'http://jira.example.com/' }
        });

        chrome.storage.local.set.should.have.been.calledWith({
          config: {
            exchange: { url: 'https://mail.example.com/' },
            jira: { url: 'http://jira.example.com/' }
          }
        });
      });

      it('should return a copy of the config in the promise', function(done) {
        var config = {
          exchange: { url: 'https://mail.example.com/' },
          jira: { url: 'http://jira.example.com/2' }
        };
        var result = configService.saveConfig(config);

        // We want same content, but not same object to prevent leaking internal structure
        $q.all([
          result.should.eventually.deep.equal(config),
          result.should.not.eventually.equal(config)
        ]).should.notify(done);

        $rootScope.$apply();
      });
    });

    describe('getExchangeUrl', function() {
      it('should return configured Exchange URL', function() {
        mockConfig({
          exchange: {
            url: 'https://mail.example.com/'
          }
        });

        configService.getExchangeUrl().should.equal('https://mail.example.com/');
      });
    });

    describe('getExchangeCredentials', function() {
      it('should return configured Exchange credentials', function() {
        mockConfig({
          exchange: {
            username: 'exchangeuser',
            password: 'exchangepassword',
            spnego: false
          }
        });

        var result = configService.getExchangeCredentials();
        result.should.have.property('username', 'exchangeuser');
        result.should.have.property('password', 'exchangepassword');
        result.should.have.property('spnego', false);
      });
    });

    describe('getJiraUrl', function() {
      it('should return configured JIRA URL', function() {
        mockConfig({
          jira: {
            url: 'https://jira.example.com/'
          }
        });

        configService.getJiraUrl().should.equal('https://jira.example.com/');
      });
    });

    describe('getJiraCredentials', function() {
      it('should return configured JIRA credentials', function() {
        mockConfig({
          jira: {
            username: 'jirauser',
            password: 'jirapassword',
            spnego: true
          }
        });

        var result = configService.getJiraCredentials();
        result.should.have.property('username', 'jirauser');
        result.should.have.property('password', 'jirapassword');
        result.should.have.property('spnego', true);
      });
    });

    afterEach(function() {
      delete chrome.storage;
    });

    function mockLocalStorage(data) {
      chrome.storage.local.get.withArgs('config').yields({
        config: data
      });
    }

    function mockConfig(data) {
      mockLocalStorage(data);
      configService.initConfig();
    }

  });

})();
