'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:SidenavctrlCtrl
 * @description
 * # SidenavctrlCtrl
 * Controller of the frontendApp
 */
angular.module('frontendApp')
  .controller('SidenavCtrl', function (Cube, Cubes, settings, $state, $scope, $window) {

    $scope.Cubes = Cubes;
    $scope.cubeName = $state.params.cubeId;
    $scope.settings = settings;

    this.hostname = $window.location.hostname;

    if (angular.isUndefined($state.params.dimension)) {
      $state.go('main.dimension.chart', {
        cubeId: Cube.name,
        dimension: _.first(_.reject(Cube.dimensions, 'type', 'time')).name,
        measures: _.first(Cube.measures).name,
        members: null,
        level: null
      });
    }

  });
