'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:dimensionRadio
 * @description
 * # dimensionRadio
 */
angular.module('frontendApp')
  .directive('dimensions', function () {
    return {
      templateUrl: 'views/directives/dimensions.html',
      restrict: 'E',
      scope: {
        cube: '=',
        current: '='
      },
      controller: function ($scope, settings) {
        $scope.label = settings.frontend_settings.sidebar_labels.dimension_selector;
      }
    };
  });
