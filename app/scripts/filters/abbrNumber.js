'use strict';
/**
 * @ngdoc filter
 * @name frontendApp.filter:abbrNumber
 * @function
 * @description
 * # abbrNumber
 * Filter in the frontendApp.
 */
angular.module('frontendApp')
  .filter('abbrNumber', function() {
    var formatSi = d3.format('.3s');
    return function financeFormatter(x) {
      var s = formatSi(x);
      switch (s[s.length - 1]) {
      case 'G':
        return s.slice(0, -1) + 'MM';
      }
      return s;
    };
  });
