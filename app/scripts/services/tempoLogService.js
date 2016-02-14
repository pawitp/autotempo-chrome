'use strict';

/**
 * A wrapper around jiraService to provide time log submission function
 *
 * TODO: Decouple UI from this service
 */
var tempoLogService = angular.module('tempoLogService', ['jiraService', 'ngQueue']);

tempoLogService.factory('tempoLogService', ['$q', '$queueFactory', '$cacheFactory', 'jiraService',
  function($q, $queueFactory, $cacheFactory, jiraService) {

    var submitQueue = $queueFactory(1);
    var accountCache = $cacheFactory('accountCache');

    function getAccountDescription(issueKey, accountKey) {
      var cachedDescription = accountCache.get(accountKey);
      if (cachedDescription) {
        return $q.when(cachedDescription);
      } else {
        return jiraService.getAccountList(issueKey)
          .then(function(accountList) {
            angular.forEach(accountList, function(account) {
              accountCache.put(account.key, account.value);
            });
            return accountCache.get(accountKey);
          });
      }
    }

    var service = {};

    service.submit = function(appointment) {
      var deferred = $q.defer();

      var result = {
        subject: appointment.subject,
        issueKey: appointment.logType.issueKey,
        accountKey: appointment.logType.accountKey,
        // TODO: standardize duration to either seconds or milliseconds
        duration: appointment.duration * 1000,
        status: 'Queued'
      };

      // Use queue to log one-by-one to prevent wrong estimates and reduce load on server
      submitQueue.enqueue(function() {
        // Notify processing
        result.style = 'warning';
        result.status = 'Processing';
        deferred.notify(result);

        return jiraService.submitTempo(appointment)
          .then(function(response) {
            // Notify success
            result.response = response.data;
            result.style = 'success';
            result.status = 'Success';
            deferred.notify(response);

            // Fetch account description (using another promise since we don't want to error out of this fails)
            getAccountDescription(result.issueKey, result.accountKey).then(function(description) {
              result.accountDescription = description;
            }).finally(function() {
              deferred.resolve(result);
            });
          })
          .catch(function(error) {
            // Notify error
            result.style = 'danger';
            result.status = 'Error';

            if (angular.isObject(error.data)) {
              // TODO: Extract error from JSON
              result.statusTooltip = angular.toJson(error.data, true);
            } else {
              result.statusTooltip = error.statusText;
            }
            console.log('Error submitting work log', error);

            // TODO: Should we use reject? (but we're turning a result not an error)
            deferred.resolve(result);
          });
      });

      return {
        result: result, 
        promise: deferred.promise
      };
    };

    return service;
  }]);
