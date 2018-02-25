'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:barChart
 * @description
 * # barChart
 */
angular.module('frontendApp')
  .directive('barChart', function ($timeout) {
    return {
      templateUrl: 'views/directives/barChart.html',
      replace: true,
      restrict: 'E',
      link: function postLink(scope, element) {

        function percentFormatter (v) { return Math.round(v * 100) + '%';}

        function toggleSerieClass (index) {
          if (_.isUndefined(index)) {
            plot.selections().classed('hovered', false);
          } else {
            plot.entities().forEach(function(entity) {
              entity.selection.classed('hovered',
                                       entity.dataset.metadata().idx === index);
            });
          }
        }

        // Bostock solution for using B instead of G in formatter
        // https://github.com/mbostock/d3/issues/2241
        var formatSi = d3.format('.3s');
        function financeFormatter(x) {
          var s = formatSi(x);
            switch (s[s.length - 1]) {
            case 'G':
              return s.slice(0, -1) + 'MM';
            }
            return s;
        }

        var placeTotalLabels = function() {
          if (_.isUndefined(totalLabelsContainer)) { return; }
          var texts = totalLabelsContainer
                .selectAll('text');
          texts
            .attr('x', function(d,i) {
              return xScale.scale(scope.aggregate.timeTicks[i].caption);
            })
            .attr('y', function(d) { return yScale.scale(d[scope.measure]) - 3; });
        };

        // dibuja los datos en un stacked bar chart
        var xScale = new Plottable.Scales.Category(),
            yScale = new Plottable.Scales.Linear(),
            xAxis = new Plottable.Axes.Category(xScale, "bottom"),
            yAxis = new Plottable.Axes.Numeric(yScale, "left"),
            plot = new Plottable.Plots.StackedBar()
              .x(_.property('time.caption'), xScale)
              .y(function(d) { return d.measures[scope.measure]; }, yScale)
              .attr("fill",
                    function(d, i, dataset) {
                      return dataset.metadata().series.color;
                    });

        plot.datasets(scope.datasets);

        var chart = new Plottable.Components.Table([
            [yAxis, plot],
            [null, xAxis]
        ]);

          chart.onRender(function() {
                            placeTotalLabels();
                          });

          chart.renderTo(d3.select(element[0].getElementsByTagName('svg')[0]));
          chart.renderImmediately();

        var totalLabelsContainer = plot.foreground()
              .append('g')
              .attr('class', 'total-labels-container');

        totalLabelsContainer
          .selectAll('text')
          .data(scope.aggregate.timeTotals)
          .enter()
          .append('text')
          .attr('text-anchor', 'middle')
          .text(function(d) {
            return financeFormatter(d[scope.measure]);
          });

          placeTotalLabels();


        // Interaction
        var pointerInteraction = new Plottable.Interactions.Pointer(),
            clickInteraction = new Plottable.Interactions.Click();

        pointerInteraction
          .onPointerMove(function(p) {
            var entity = _.first(plot.entitiesAt(p)),
                metadata;

            if (!_.isUndefined(entity)) {
              metadata = entity.dataset.metadata();
              scope.highlightItem({
                caption: entity.dataset.metadata().series.caption,
                measures: entity.datum.measures,
                selection: entity.selection,
                series: entity.datum.time.caption
              });
            }
            else {
              toggleSerieClass(undefined);
              scope.highlightItem(undefined);
            }
            toggleSerieClass(metadata ? metadata.idx : undefined);
          })
          .onPointerExit(function() {
            toggleSerieClass();
            scope.highlightItem();
          });

        clickInteraction.onClick(function(p) {
          var entity = _.first(plot.entitiesAt(p)),
              metadata;

          if (_.isUndefined(entity)) {
            return; // return early if no entity
          }

          metadata = entity.dataset.metadata();
          scope.drillDown(metadata.series);
        });

        pointerInteraction.attachTo(plot);
        clickInteraction.attachTo(plot);

        // time ticks (x-axis) interaction
        // Only enable if current time dim is year
        if (scope.aggregate.timeDim.level === 'Year') {
          var timeTicksContainer = d3.select('.x-axis', plot._element[0]);
          timeTicksContainer
            .on('mousedown', function() {
              var t = d3.event.target.tagName;
              if (t !== 'text') {
                return;
              }

              var tt = _.find(scope.aggregate.timeTicks,
                              {caption: d3.event.target.__data__});
              scope.setDate(tt.name);
            });
        }

        d3.select(window).on('resize', function  () {
          $timeout(function() {
            chart.redraw();
          });
        });

        scope.$watch('legendOpen', function () {
          $timeout(function() {
            chart.redraw();
          });
        });

        scope.$watch('model.normalizeValues', function (newVal) {
          if (newVal) {
            plot.y(function(d) { return d.percent[scope.measure]; }, yScale)
              .labelsEnabled(true)
              .labelFormatter(percentFormatter);
            yAxis.formatter(percentFormatter);
          }
          else {
            plot.y(function(d) { return d.measures[scope.measure]; }, yScale)
              .labelsEnabled(false);
            yAxis.formatter(financeFormatter);
          }
        });

        var compactMap = _.compose(_.compact, _.map);

        var toItem = function(entity) {
          return {
            value: entity.datum.measures[scope.measure],
            selection: entity.selection,
            series: entity.datum.time.caption
          };
        };

        scope.$watch('highlighted.serie', function (serie) {
          if (_.isUndefined(serie)) {
            toggleSerieClass();
            scope.highlightedSeries = {};
            return;
          }


          var dset = scope.findDataset(plot.datasets(), serie);
          toggleSerieClass(dset._metadata.idx);

          var hs = _.indexBy(
            _.filter(plot.entities(),
                     function(e) {
                       return e.dataset.metadata().series === serie;
                     }),
            'datum.time.name');

          // XXX TODO: optimize, this is awful
          scope.highlightedSeries = _.object(
            compactMap(
              hs,
              function(entity, key) {
                if (_.isNull(entity.datum.measures[scope.measure]) ||
                    _.isUndefined(entity.datum.measures[scope.measure]) ||
                    entity.datum.measures[scope.measure] === 0) {
                  return null;
                }
                else {
                  var i = _.findIndex(scope.aggregate.timeTicks, {name: key }),
                      prevKey = i > 0 ? scope.aggregate.timeTicks[i - 1].name : null,
                      prevValue = _.has(hs, prevKey) ? hs[prevKey].datum.measures[scope.measure] : null;

                  return [
                    key,
                    _.assign({prevValue: prevValue }, toItem(entity))
                  ];
                }
              }
            )
          );
        });
      }
    };
  });
