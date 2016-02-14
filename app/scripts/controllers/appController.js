'use strict';

var appController = angular.module('appController', []);

appController.controller('AppController', ['$scope',
  function($scope) {
    var vm = this;

    vm.warnDirtyConfig = function() {
      $scope.$broadcast('configClosed');
    };

  }]);
