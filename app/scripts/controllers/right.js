'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:RightCtrl
 * @description
 * # RightCtrl
 * Controller of the frontendApp
 */
angular.module('frontendApp')
  .controller('RightCtrl', function ($stateParams, $scope, $state, aggregate, $timeout, $mdMedia, $rootScope, CubesService) {
    $scope.dimension = $stateParams.dimension;
    $scope.highlighted = {};
    $rootScope.legendOpen = _.isUndefined($rootScope.legendOpen) ? $mdMedia('gt-md') : $rootScope.legendOpen;
    $scope.selectedChart = $state.params.chart;
    $scope.fabOpen = false;

    $scope.highlightSerie = function (serie) {
      $timeout(function() {
        $scope.highlighted.serie = serie;
      });
    };

    $scope.highlightItem = function (item) {
      $timeout(function() {
        $scope.highlighted.item = item;
      });
    };

    $scope.openLegend = function() {
      $timeout(function() {
        $rootScope.legendOpen = true;
      });
    };

    $scope.closeLegend = function() {
      $timeout(function() {
        $rootScope.legendOpen = false;
      });
    };

    $scope.drillDown = function (member) {
        if ($stateParams.breakDown) {
          // XXX TODO duplicated in legendCtrl
          var bd = $stateParams.breakDown.split('.'),
              bdDim = _.find(CubesService.cube.dimensions, {name: bd[0]}),
              bdLevel =  bdDim.hierarchies[0].levels[member.depth];

          $state.go('main.dimension.chart',
                    {
                      breakDown: [bdDim.name, bdLevel.name].join('.'),
                      breakDownMember: member.key
                    });
        }
        else {
          $state.go('main.dimension.chart', {
            members: member.key,
            level: aggregate.hierarchies[member.depth].name
          });
        }
    };
  });
