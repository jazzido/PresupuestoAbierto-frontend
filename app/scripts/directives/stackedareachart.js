'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:stackedAreaChart
 * @description
 * # stackedAreaChart
 */
angular.module('frontendApp')
  .directive('stackedAreaChart', function (settings) {
    return {
      template: '<svg class="plottable" height="100%" width="95%" flex></svg>',
      replace: true,
      restrict: 'E',
      link: function postLink(scope, element) {

        // dibuja los datos en un stacked area chart
        var xScale = new Plottable.Scales.Category();
        var yScale = new Plottable.Scales.Linear();

        var xAxis = new Plottable.Axes.Category(xScale, "bottom"),
            yAxis = new Plottable.Axes.Numeric(yScale, "left"),
            colorScale = new Plottable.Scales.Color().range(settings.CSCALE);


        var plot = new Plottable.Plots.StackedArea();

        plot
          .x(_.property('time.key'), xScale)
          .y(_.property('value'), yScale)
          .attr("fill",
                function(d, i, dataset) {
                  return dataset.metadata().series.color;
                },
                colorScale)
          .attr("stroke-width", 0);

        if (scope.model.normalizeValues) {
          plot.y(_.property('percent'), yScale);
          yAxis.formatter(function(v) { return Math.round(v * 100) + '%';});
        }
        else {
          yAxis.formatter(d3.format('.2s'));
        }
        plot.datasets(scope.datasets);

        var chart = new Plottable.Components.Table([
            [yAxis, plot],
            [null, xAxis]
        ]);

        chart.renderTo(d3.select(element[0]));

        plot.selections()
          .on('mouseover', function (dataset, i) {
            d3.select(this).classed('hovered', true);
            var metadata = plot.datasets()[i].metadata();
            var member = metadata.series;
            scope.highlight(member);
          })
          .on('mouseout', function () {
            d3.select(this).classed('hovered', false);
            scope.highlight();
          })
          .on('click', function (dataset, i) {
            var metadata = plot.datasets()[i].metadata(),
              member = metadata.series;

            scope.drillDown(member);
          });

        var timeTicksContainer = d3.select('.x-axis', plot._element[0]);
        timeTicksContainer
          .on('mousedown', function() {
            var t = d3.event.target.tagName;
            if (t !== 'text') {
              return;
            }
            // XXX TODO aca hacer el drilldown de fecha
            console.log(t);
          });

        d3.select(window).on('resize', function  () {
          chart.redraw();
        });

        scope.$watch('datasets', function () {
          chart.redraw();
        });

        scope.$watch('highlighted.member', function (member) {
          if (_.isUndefined(member)) {
            plot.selections().classed('hovered', false);
          } else {
            var dset = scope.findDataset(plot.datasets(), member);
            d3.select(plot.selections()[0][dset._metadata.idx]).classed('hovered', true);
          }
        });

        scope.$watch('model.selectedDateTick', function(timeIndex) {
          console.log(timeIndex);
        });

      }
    };
  });
