'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:breadcrumbs
 * @description
 * # breadcrumbs de navegacion
 */

angular.module('frontendApp')
  .directive('breadcrumbs', function () {
    return {
      templateUrl: 'views/directives/breadcrumbs.html',
      restrict: 'E',
      replace: true
    };
  });
