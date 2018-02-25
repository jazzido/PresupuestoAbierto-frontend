'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:FiltersCtrl
 * @description
 * # FiltersCtrl
 * Controller of the frontendApp
 */
angular.module('frontendApp')
  .controller('FiltersCtrl', function ($state, $scope, Cube, Cubes) {
    $scope.Cube = Cube;
    $scope.Cubes = Cubes;

    $scope.current = {
      dimension: $state.params.dimension,
      measure: $state.params.measures
    };

  });
