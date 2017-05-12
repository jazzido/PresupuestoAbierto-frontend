'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:ChartctrlCtrl
 * @description
 * # ChartctrlCtrl
 * Controller of the frontendApp
 */

angular.module('frontendApp')
  .controller('ChartCtrl', function ($scope, $state, aggregate, $stateParams, CubesService) {

    var compactMap = _.compose(_.compact, _.map);

    $scope.aggregate = aggregate;
    var activeMeasure = _.find(CubesService.cube.measures, {name: $stateParams.measures });
    $scope.activeMeasure = activeMeasure || CubesService.cube.measures[0];
    $scope.measure = $scope.activeMeasure.name;

    // XXX TODO: duplicated in LegendCtrl
    $scope.datasets = compactMap(aggregate.datasets, function(ds, i) {
      if (_.every(_.map(ds,
                        function(d) {
                          var v = d.measures[$scope.activeMeasure.name];
                          return _.isNull(v) || _.isUndefined(v) || v === 0;
                        }))) {
        return null;
      }
      else {
        return new Plottable.Dataset(ds)
          .metadata({
            idx: i,
            series: aggregate.series[i]
          });
      }
    });


    this.cube = $scope.cube;

    $scope.setDate = function(date) {
      $state.go('main.dimension.chart', {
        date: date
      }, {location: 'replace'});
    };

    // this is for the timeslider on the treemap
    $scope.setSelectedDateTick = function() {
      $state.go('main.dimension.chart', {
         dateTick: $scope.model.selectedDateTick
      }, {location: 'replace', notify: false});
    };

    $scope.model = {
      dimension: $stateParams.dimension,
      normalizeValues: !!$state.params.percent,
      selectedDateTick: _.isUndefined($stateParams.dateTick) ? 0 : $stateParams.dateTick
    };

    $scope.findDataset = function(datasets, target) {
      return _.find(datasets,
                    function(ds) {
                      return ds._metadata.series.key === target.key;
                    });
    };

    this.setNormalizeValues = function() {
      $state.go('main.dimension.chart', {
        percent: $scope.model.normalizeValues ? 'true' : null
      }, { location: 'replace', notify: false });
    };

  });
