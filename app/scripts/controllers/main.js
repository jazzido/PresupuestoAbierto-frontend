'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the frontendApp
 */

angular.module('frontendApp')
  .controller('MainCtrl', function (Cube, $scope) {
    $scope.cube = Cube;
  });
