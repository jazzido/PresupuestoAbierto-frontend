'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:LegendCtrl
 * @description
 * # LegendCtrl
 * Controller of the frontendApp
 */
angular.module('frontendApp')
  .controller('LegendCtrl', function (aggregate, $scope, $rootScope, $state, $stateParams, CubesService) {
    this.hierarchies = aggregate.hierarchies;

    // filter out empty series
    var compactMap = _.compose(_.compact, _.map);
    var activeMeasure = _.find(CubesService.cube.measures,
                                 { name: $stateParams.measures }) || CubesService.cube.measures[0];

    // XXX TODO: duplicated in ChartCtrl
    this.series = compactMap(aggregate.datasets,
                             function(ds, i) {
                               if (_.every(_.map(ds,
                                                 function(d) {
                                                   var v = d.measures[activeMeasure.name];
                                                   return _.isNull(v) || _.isUndefined(v) || v === 0;
                                                 }))) {
                                 return null;
                               }
                               else {
                                 return aggregate.series[i];
                               }
                             });

    this.drillDownHref = function(member) {
      var rv;
      if (_.isUndefined($stateParams.breakDown)) {
        // no breakdown, drilldown on the main dimension
        rv = $state.href('main.dimension.chart',
                         {
                           members: member.key,
                           level: this.hierarchies[member.depth].name
                         });
      }
      else {
        var bd = $stateParams.breakDown.split('.'),
            bdDim = _.find(CubesService.cube.dimensions, {name: bd[0]}),
            bdLevel =  bdDim.hierarchies[0].levels[member.depth];

        rv = $state.href('main.dimension.chart',
                         {
                           breakDown: [bdDim.name, bdLevel.name].join('.'),
                           breakDownMember: member.key
                         });
      }
      return rv;
    };


    this.mouseOver = function(member) {
      $scope.highlightSerie(member);
    };

    this.mouseOut = function() {
      $scope.highlightSerie();
    };

    this.toggleLegend = function() {
      var legendOpen = !$rootScope.legendOpen;
      if (legendOpen) {
        $scope.openLegend();
      }
      else {
        $scope.closeLegend();
      }
    };
  });
