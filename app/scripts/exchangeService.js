'use strict';

var exchangeService = angular.module('exchangeService', ['base64', 'configService']);

exchangeService.factory('exchangeService', ['$http', '$base64', 'configService',
  function($http, $base64, configService) {
    var EXCHANGE_GET_FOLDER_REQ = '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" ' +
      'xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
      '<soap:Header>' +
      '<t:RequestServerVersion Version="Exchange2010_SP2"></t:RequestServerVersion>' +
      '</soap:Header>' +
      '<soap:Body>' +
      '<m:GetFolder>' +
      '<m:FolderShape>' +
      '<t:BaseShape>AllProperties</t:BaseShape>' +
      '</m:FolderShape>' +
      '<m:FolderIds>' +
      '<t:DistinguishedFolderId Id="calendar"></t:DistinguishedFolderId>' +
      '</m:FolderIds>' +
      '</m:GetFolder>' +
      '</soap:Body>' +
      '</soap:Envelope>';

    var EXCHANGE_GET_APPOINTMENTS_REQ = '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" ' +
      'xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
      '<soap:Header>' +
      '<t:RequestServerVersion Version="Exchange2010_SP2"></t:RequestServerVersion>' +
      '</soap:Header>' +
      '<soap:Body>' +
      '<m:FindItem Traversal="Shallow">' +
      '<m:ItemShape>' +
      '<t:BaseShape>AllProperties</t:BaseShape>' +
      '</m:ItemShape>' +
      '<m:CalendarView StartDate="{{ startDate }}" EndDate="{{ endDate }}"></m:CalendarView>' +
      '<m:ParentFolderIds>' +
      '<t:FolderId Id="{{ folderId }}" ChangeKey="{{ folderChangeKey }}"></t:FolderId>' +
      '</m:ParentFolderIds>' +
      '</m:FindItem>' +
      '</soap:Body>' +
      '</soap:Envelope>';

    function parseExchangeAppointments(response) {
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(response.data, 'application/xml');
      var items = xmlDoc.getElementsByTagName('CalendarItem');
      var parsedItems = [];

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        parsedItems.push({
          itemId: item.getElementsByTagName('ItemId')[0].getAttribute('Id'),
          subject: item.getElementsByTagName('Subject')[0].childNodes[0].nodeValue,
          start: parseDate(item.getElementsByTagName('Start')[0].childNodes[0].nodeValue),
          end: parseDate(item.getElementsByTagName('End')[0].childNodes[0].nodeValue),
          categories: parseXmlArray(item.getElementsByTagName('Categories')[0]),
          myResponseType: item.getElementsByTagName('MyResponseType')[0].childNodes[0].nodeValue
        });
      }

      return parsedItems;
    }

    function parseXmlArray(element) {
      var parsedArray = [];
      var items = element.getElementsByTagName('String');
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        parsedArray.push(item.childNodes[0].nodeValue);
      }
      return parsedArray;
    }

    function parseDate(value) {
      var timestamp = Date.parse(value);
      return new Date(timestamp);
    }

    function getExchangeHeaders() {
      var credentials = $base64.encode(configService.getExchangeUsername() + ':' + configService.getExchangePassword());
      return {
        'Content-Type': 'text/xml',
        'Authorization': 'Basic ' + credentials
      };
    }

    var service = {};

    service.getExchangeFolder = function() {
      return $http.post(configService.getExchangeUrl(), EXCHANGE_GET_FOLDER_REQ, {
        headers: getExchangeHeaders()
      }).then(function successCallback(response) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(response.data, 'application/xml');
        var folderId = xmlDoc.getElementsByTagName('FolderId')[0].getAttribute('Id');
        var folderChangeKey = xmlDoc.getElementsByTagName('FolderId')[0].getAttribute('ChangeKey');

        console.log('Got folderId ' + folderId + ' and folderChangeKey ' + folderChangeKey);

        return {
          id: folderId,
          changeKey: folderChangeKey
        };
      });
    };

    service.getExchangeAppointments = function(exchangeFolder, date) {
      var startDate = new Date(date);
      startDate.setHours(0);
      startDate.setMinutes(0);
      startDate.setSeconds(1);

      var endDate = new Date(date);
      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);

      var request = EXCHANGE_GET_APPOINTMENTS_REQ
        .replace('{{ startDate }}', startDate.toISOString())
        .replace('{{ endDate }}', endDate.toISOString())
        .replace('{{ folderId }}', exchangeFolder.id)
        .replace('{{ folderChangeKey }}', exchangeFolder.changeKey);

      return $http.post(configService.getExchangeUrl(), request, {
        headers: getExchangeHeaders()
      }).then(function successCallback(response) {
        return parseExchangeAppointments(response);
      });
    };

    return service;
  }]);
