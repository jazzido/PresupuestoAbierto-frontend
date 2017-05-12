'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:charttype
 * @description
 * # charttype
 */
angular.module('frontendApp')
  .directive('charttype', function () {
    return {
      templateUrl: 'views/directives/charttype.html',
      restrict: 'E',
      replace: true
    };
  });
