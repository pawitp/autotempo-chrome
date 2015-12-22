/*jshint expr: true*/
(function() {
  'use strict';

  describe('exchangeService', function() {

    var $httpBackend, exchangeService, configService;

    var EXCHANGE_FOLDER = {
      id: 'MY_FOLDER_ID',
      changeKey: 'MY_CHANGE_KEY'
    };

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
      exchangeService = $injector.get('exchangeService');
      configService = $injector.get('configService');
    }));

    it('should send test/xml content type', function() {
      $httpBackend
        .expect('POST', 'https://mail.example.com/ews/exchange.asmx', undefined, function(headers) {
          headers['Content-Type'].should.equal('text/xml');
          return true;
        }).respond(500, '');

      exchangeService.getExchangeFolder();

      $httpBackend.flush();
    });

    it('should support authenticating with Basic authentication', function() {
      $httpBackend
        .expect('POST', 'https://mail.example.com/ews/exchange.asmx', undefined, function(headers) {
          headers.Authorization.should.equal('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
          return true;
        }).respond(500, '');

      exchangeService.getExchangeFolder();

      $httpBackend.flush();
    });

    it('should support authenticating with SPNEGO authentication', function() {
      $httpBackend
        .expect('POST', 'https://mail.example.com/ews/exchange.asmx', undefined, function(headers) {
          expect(headers.Authorization).to.be.undefined;
          return true;
        }).respond(500, '');

      configService.getExchangeCredentials = function() {
        return {
          spnego: true
        };
      };

      exchangeService.getExchangeFolder();

      $httpBackend.flush();
    });

    describe('getExchangeFolder', function() {
      it('should send folder request and parse response', function() {
        $httpBackend
          .expect('POST', 'https://mail.example.com/ews/exchange.asmx', /GetFolder/)
          .respond('<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><h:ServerVersionInfo xmlns:h="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" MajorVersion="15" MinorVersion="1" MajorBuildNumber="355" MinorBuildNumber="19" Version="V2015_10_05"/></s:Header><s:Body><m:GetFolderResponse xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"><m:ResponseMessages><m:GetFolderResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Folders><t:CalendarFolder><t:FolderId Id="MY_FOLDER_ID" ChangeKey="MY_CHANGE_KEY"/><t:ParentFolderId Id="MY_PARENT_FOLDER_ID" ChangeKey="MY_PARENT_CHANGE_KEY=="/><t:FolderClass>IPF.Appointment</t:FolderClass><t:DisplayName>Calendar</t:DisplayName></t:CalendarFolder></m:Folders></m:GetFolderResponseMessage></m:ResponseMessages></m:GetFolderResponse></s:Body></s:Envelope>');

        exchangeService.getExchangeFolder().should.eventually.deep.equal(EXCHANGE_FOLDER);

        $httpBackend.flush();
      });
    });

    describe('getExchangeAppointments', function() {
      it('should send request with correct date and folder id', function() {
        $httpBackend
          .expect('POST', 'https://mail.example.com/ews/exchange.asmx', /m:CalendarView StartDate="2015-08-20T17:00:01\.000Z" EndDate="2015-08-21T16:59:59\.000Z"(.*)<t:FolderId Id="MY_FOLDER_ID" ChangeKey="MY_CHANGE_KEY">/)
          .respond(500, '');

        exchangeService.getExchangeAppointments(EXCHANGE_FOLDER, new Date('2015-08-21T13:00:00'));

        $httpBackend.flush();
      });

      it('should be able to parse response with category', function() {
        $httpBackend
          .expect('POST', 'https://mail.example.com/ews/exchange.asmx', /CalendarView/)
          .respond('<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><h:ServerVersionInfo MajorVersion="15" MinorVersion="1" MajorBuildNumber="355" MinorBuildNumber="19" Version="V2015_10_05" xmlns:h="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/></s:Header><s:Body><m:FindItemResponse xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"><m:ResponseMessages><m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:RootFolder TotalItemsInView="1" IncludesLastItemInRange="true"><t:Items><t:CalendarItem><t:ItemId Id="ITEM_ID" ChangeKey="ITEM_CHKEY"/><t:ParentFolderId Id="PARENT_ID" ChangeKey="PARENT_CHKEY"/><t:ItemClass>IPM.Appointment</t:ItemClass><t:Subject>Hackathon</t:Subject><t:Sensitivity>Normal</t:Sensitivity><t:DateTimeReceived>2015-11-06T09:18:46Z</t:DateTimeReceived><t:Size>4122</t:Size><t:Categories><t:String>Training</t:String><t:String>Cat2</t:String></t:Categories><t:Importance>Normal</t:Importance><t:IsSubmitted>false</t:IsSubmitted><t:IsDraft>false</t:IsDraft><t:IsFromMe>false</t:IsFromMe><t:IsResend>false</t:IsResend><t:IsUnmodified>false</t:IsUnmodified><t:DateTimeSent>2015-11-06T09:18:46Z</t:DateTimeSent><t:DateTimeCreated>2015-11-06T09:18:46Z</t:DateTimeCreated><t:ReminderDueBy>2015-11-07T02:00:00Z</t:ReminderDueBy><t:ReminderIsSet>false</t:ReminderIsSet><t:ReminderMinutesBeforeStart>15</t:ReminderMinutesBeforeStart><t:HasAttachments>false</t:HasAttachments><t:Culture>en-US</t:Culture><t:EffectiveRights><t:CreateAssociated>false</t:CreateAssociated><t:CreateContents>false</t:CreateContents><t:CreateHierarchy>false</t:CreateHierarchy><t:Delete>true</t:Delete><t:Modify>true</t:Modify><t:Read>true</t:Read><t:ViewPrivateItems>true</t:ViewPrivateItems></t:EffectiveRights><t:LastModifiedName>LAST MODIFIED USER</t:LastModifiedName><t:LastModifiedTime>2015-11-07T06:37:07Z</t:LastModifiedTime><t:IsAssociated>false</t:IsAssociated><t:WebClientReadFormQueryString>https://mail.example.com/owa/?ItemID=XXXX</t:WebClientReadFormQueryString><t:WebClientEditFormQueryString>https://mail.example.com/owa/?ItemID=XXX</t:WebClientEditFormQueryString><t:ConversationId Id="CONVERSATION_ID"/><t:UID>UUID</t:UID><t:DateTimeStamp>2015-11-07T06:37:07Z</t:DateTimeStamp><t:Start>2015-11-07T02:00:00Z</t:Start><t:End>2015-11-07T14:00:00Z</t:End><t:IsAllDayEvent>false</t:IsAllDayEvent><t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:Location/><t:IsMeeting>false</t:IsMeeting><t:IsCancelled>false</t:IsCancelled><t:IsRecurring>false</t:IsRecurring><t:MeetingRequestWasSent>false</t:MeetingRequestWasSent><t:IsResponseRequested>true</t:IsResponseRequested><t:CalendarItemType>Single</t:CalendarItemType><t:MyResponseType>Organizer</t:MyResponseType><t:Organizer><t:Mailbox><t:Name>USER NAME</t:Name><t:EmailAddress>/O=MY COMPANY/CN=USER@EXAMPLE.COM</t:EmailAddress><t:RoutingType>EX</t:RoutingType><t:MailboxType>OneOff</t:MailboxType></t:Mailbox></t:Organizer><t:Duration>PT12H</t:Duration><t:TimeZone>(UTC+07:00) Bangkok, Hanoi, Jakarta</t:TimeZone><t:AppointmentSequenceNumber>0</t:AppointmentSequenceNumber><t:AppointmentState>0</t:AppointmentState><t:IsOnlineMeeting>false</t:IsOnlineMeeting></t:CalendarItem></t:Items></m:RootFolder></m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse></s:Body></s:Envelope>');

        var result = exchangeService.getExchangeAppointments(EXCHANGE_FOLDER, new Date('2015-08-21T13:00:00'));
        result.should.eventually.have.length.of(1);
        result.should.eventually.have.deep.property('[0].subject', 'Hackathon');
        result.should.eventually.have.deep.property('[0].itemId', 'ITEM_ID');
        result.should.eventually.have.deep.property('[0].start').to.equal(new Date('2015-11-07T02:00:00Z'));
        result.should.eventually.have.deep.property('[0].end').to.equal(new Date('2015-11-07T14:00:00Z'));
        result.should.eventually.have.deep.property('[0].categories').to.equal(['Training', 'Cat2']);

        $httpBackend.flush();
      });

      it('should be able to parse response without category', function() {
      $httpBackend
        .expect('POST', 'https://mail.example.com/ews/exchange.asmx', /CalendarView/)
        .respond('<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><h:ServerVersionInfo MajorVersion="15" MinorVersion="1" MajorBuildNumber="355" MinorBuildNumber="19" Version="V2015_10_05" xmlns:h="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/></s:Header><s:Body><m:FindItemResponse xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"><m:ResponseMessages><m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:RootFolder TotalItemsInView="1" IncludesLastItemInRange="true"><t:Items><t:CalendarItem><t:ItemId Id="ITEM_ID" ChangeKey="ITEM_CHKEY"/><t:ParentFolderId Id="PARENT_ID" ChangeKey="PARENT_CHKEY"/><t:ItemClass>IPM.Appointment</t:ItemClass><t:Subject>Hackathon</t:Subject><t:Sensitivity>Normal</t:Sensitivity><t:DateTimeReceived>2015-11-06T09:18:46Z</t:DateTimeReceived><t:Size>4122</t:Size><t:Importance>Normal</t:Importance><t:IsSubmitted>false</t:IsSubmitted><t:IsDraft>false</t:IsDraft><t:IsFromMe>false</t:IsFromMe><t:IsResend>false</t:IsResend><t:IsUnmodified>false</t:IsUnmodified><t:DateTimeSent>2015-11-06T09:18:46Z</t:DateTimeSent><t:DateTimeCreated>2015-11-06T09:18:46Z</t:DateTimeCreated><t:ReminderDueBy>2015-11-07T02:00:00Z</t:ReminderDueBy><t:ReminderIsSet>false</t:ReminderIsSet><t:ReminderMinutesBeforeStart>15</t:ReminderMinutesBeforeStart><t:HasAttachments>false</t:HasAttachments><t:Culture>en-US</t:Culture><t:EffectiveRights><t:CreateAssociated>false</t:CreateAssociated><t:CreateContents>false</t:CreateContents><t:CreateHierarchy>false</t:CreateHierarchy><t:Delete>true</t:Delete><t:Modify>true</t:Modify><t:Read>true</t:Read><t:ViewPrivateItems>true</t:ViewPrivateItems></t:EffectiveRights><t:LastModifiedName>LAST MODIFIED USER</t:LastModifiedName><t:LastModifiedTime>2015-11-07T06:37:07Z</t:LastModifiedTime><t:IsAssociated>false</t:IsAssociated><t:WebClientReadFormQueryString>https://mail.example.com/owa/?ItemID=XXXX</t:WebClientReadFormQueryString><t:WebClientEditFormQueryString>https://mail.example.com/owa/?ItemID=XXX</t:WebClientEditFormQueryString><t:ConversationId Id="CONVERSATION_ID"/><t:UID>UUID</t:UID><t:DateTimeStamp>2015-11-07T06:37:07Z</t:DateTimeStamp><t:Start>2015-11-07T02:00:00Z</t:Start><t:End>2015-11-07T14:00:00Z</t:End><t:IsAllDayEvent>false</t:IsAllDayEvent><t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:Location/><t:IsMeeting>false</t:IsMeeting><t:IsCancelled>false</t:IsCancelled><t:IsRecurring>false</t:IsRecurring><t:MeetingRequestWasSent>false</t:MeetingRequestWasSent><t:IsResponseRequested>true</t:IsResponseRequested><t:CalendarItemType>Single</t:CalendarItemType><t:MyResponseType>Organizer</t:MyResponseType><t:Organizer><t:Mailbox><t:Name>USER NAME</t:Name><t:EmailAddress>/O=MY COMPANY/CN=USER@EXAMPLE.COM</t:EmailAddress><t:RoutingType>EX</t:RoutingType><t:MailboxType>OneOff</t:MailboxType></t:Mailbox></t:Organizer><t:Duration>PT12H</t:Duration><t:TimeZone>(UTC+07:00) Bangkok, Hanoi, Jakarta</t:TimeZone><t:AppointmentSequenceNumber>0</t:AppointmentSequenceNumber><t:AppointmentState>0</t:AppointmentState><t:IsOnlineMeeting>false</t:IsOnlineMeeting></t:CalendarItem></t:Items></m:RootFolder></m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse></s:Body></s:Envelope>');

        var result = exchangeService.getExchangeAppointments(EXCHANGE_FOLDER, new Date('2015-08-21T13:00:00'));
        result.should.eventually.have.length.of(1);
        result.should.eventually.have.deep.property('[0].subject', 'Hackathon');
        result.should.eventually.have.deep.property('[0].itemId', 'ITEM_ID');
        result.should.eventually.have.deep.property('[0].start').to.equal(new Date('2015-11-07T02:00:00Z'));
        result.should.eventually.have.deep.property('[0].end').to.equal(new Date('2015-11-07T14:00:00Z'));
        result.should.eventually.have.deep.property('[0].categories').to.be.empty;

        $httpBackend.flush();
      });
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

  });

})();
