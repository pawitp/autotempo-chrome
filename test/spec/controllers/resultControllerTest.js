/*jshint expr: true*/
(function() {
  'use strict';

  describe('resultController', function() {

    var vm, $scope;

    beforeEach(module('resultController'));

    beforeEach(inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      vm = $controller('ResultController', { $scope: $scope });
    }));

    it('should add result to results array when it receives a message', function() {
      var result = { test: 'result' };
      $scope.$broadcast('result', { result: result });

      vm.results.should.contains(result);
    });

    describe('clearResult', function() {
      it('should clear all results', function() {
        vm.results = [1, 2, 3];
        vm.clearResult();
        vm.results.should.be.empty;
      });
    });

  });

})();
