'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:dimensionRadio
 * @description
 * # dimensionRadio
 */
angular.module('frontendApp')
  .directive('measures', function () {
    return {
      templateUrl: 'views/directives/measures.html',
      restrict: 'E',
      scope: {
        cube: '=',
        current: '='
      },
      controller: function ($scope, settings) {
        $scope.label = settings.frontend_settings.sidebar_labels.measure_selector;
      }
    };
  });
