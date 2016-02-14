'use strict';

var resultController = angular.module('resultController', []);

resultController.controller('ResultController', ['$scope',
  function($scope) {
    var vm = this;

    vm.results = [];

    vm.clearResult = function() {
      vm.results = [];
    };

    $scope.$on('result', function(event, data) {
      vm.results.unshift(data.result);
      // We also have data.promise, but we don't need to do anything for now
    });

  }]);
