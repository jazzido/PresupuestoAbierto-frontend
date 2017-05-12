'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:tableChart
 * @description
 * # tableChart
 */
angular.module('frontendApp')
  .directive('tableChart', function () {
    return {
      templateUrl: 'views/directives/tableChart.html',
      restrict: 'E',
      replace: true,
      link: function postLink(scope) {
        // juggle the data so it fits an HTML table
        scope.table_data = _.unzip(scope.aggregate.datasets);
      }
    };
  });
