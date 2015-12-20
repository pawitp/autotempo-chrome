/*jshint expr: true*/
(function() {
  'use strict';

  describe('exchangeService', function() {

    var $httpBackend;

    beforeEach(module('exchangeService'));

    beforeEach(function() {
      module(function($provide) {
        $provide.value('configService', {
          getExchangeCredentials: function() {
            return {
              username: 'username',
              password: 'password',
              spnego: false
            };
          },
          getExchangeUrl: function() {
            return 'https://mail.example.com/';
          }
        });
      });
    });

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should support authenticating with Basic authentication');
    it('should support authenticating with SPNEGO authentication');

    describe('getExchangeFolder', function() {
      it('should send folder request and parse response', inject(function(exchangeService) {
        $httpBackend
          .expect('POST', 'https://mail.example.com/ews/exchange.asmx', /GetFolder/)
          .respond('<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><h:ServerVersionInfo xmlns:h="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" MajorVersion="15" MinorVersion="1" MajorBuildNumber="355" MinorBuildNumber="19" Version="V2015_10_05"/></s:Header><s:Body><m:GetFolderResponse xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"><m:ResponseMessages><m:GetFolderResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Folders><t:CalendarFolder><t:FolderId Id="MY_FOLDER_ID" ChangeKey="MY_CHANGE_KEY"/><t:ParentFolderId Id="MY_PARENT_FOLDER_ID" ChangeKey="MY_PARENT_CHANGE_KEY=="/><t:FolderClass>IPF.Appointment</t:FolderClass><t:DisplayName>Calendar</t:DisplayName></t:CalendarFolder></m:Folders></m:GetFolderResponseMessage></m:ResponseMessages></m:GetFolderResponse></s:Body></s:Envelope>');

        exchangeService.getExchangeFolder().should.eventually.deep.equal({
          id: 'MY_FOLDER_ID',
          changeKey: 'MY_CHANGE_KEY'
        });

        $httpBackend.flush();
      }));
    });

    describe('getExchangeAppointments', function() {
      it('should send request with correct date and folder id');
      it('should be able to parse response with category');
      it('should be able to parse response without category');
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

  });

})();
