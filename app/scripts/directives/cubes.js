'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:dimensionRadio
 * @description
 * # dimensionRadio
 */
angular.module('frontendApp')
  .directive('cubes', function () {
    return {
      templateUrl: 'views/directives/cubes.html',
      restrict: 'E',
      scope: {
        cubes: '=',
        current: '='
      },
      controllerAs: 'ctrl',
      controller: function ($scope, $state, settings, CubesService) {

        $scope.label = settings.frontend_settings.sidebar_labels.cube_selector;

        this.selectCube = function () {
          CubesService.getCube($scope.current).then(function (cube) {
            $state.go('main.dimension.chart', {
              cubeId: cube.name,
              dimension: _.first(_.reject(cube.dimensions, 'type', 'time')).name,
              measures: _.first(cube.measures).name,
              members: null,
              level: null
            });
          });
        };
      }
    };
  });
