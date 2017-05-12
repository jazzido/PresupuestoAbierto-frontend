/* globals d3plus */
'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:sankeyChart
 * @description
 * # treeMapChart
 */
angular.module('frontendApp')
  .directive('treeMapChart', function (settings, $timeout) {
    return {
      templateUrl: 'views/directives/treeMapChart.html',
      replace: true,
      restrict: 'E',
      link: function postLink(scope, element) {

        // armar una estructura para d3.layout.treemap
        var tm = {
          name: 'root'
        };

        function buildChildren (timeIndex) {
          var children = _.compact(_.map(scope.datasets, function(ds) {
            var rv, value = ds.data()[timeIndex].measures[scope.measure];
            if (value === 0 ||
                _.isNull(value)) {
              rv = null;
            }
            else {
              rv = {
                _metadata: ds.metadata(),
                value: value,
                measures: ds.data()[timeIndex].measures
              };
            }
            return rv;
          }));
          return children;
        }

        function buildDatasets (tm) {
          var tm_layout = d3.layout.treemap()
                .padding(0)
                .size([250,100])
                .sort(function(a,b) {
                  return a.measures[scope.measure] - b.measures[scope.measure];
                })
                .nodes(tm),
              dataset = new Plottable.Dataset(tm_layout[0].children);
          return [dataset];
        }

        function placeLabels (plot) {
          var svg = plot._rootSVG,
              labels = plot.foreground();

          // remove existing labels, if any
          var ln = labels.node();
          while(ln && ln.firstChild) {
            ln.removeChild(ln.firstChild);
          }

          _.each(plot.selections()[0], function(s) {
            var r = d3.select(s);
            var bb = s.getBBox();


            if (bb.height * bb.width < 100) {
              return;
            }

            var dark = Plottable.Utils.Color.contrast("white",
                                                      r.attr('fill')) * 1.6 < Plottable.Utils.Color.contrast("black", r.attr('fill'));

            var nameLabel = labels.append('text')
                  .attr('fill', dark ? '#212121' : 'white');
            d3plus.textwrap(nameLabel)
              .container(nameLabel)
              .resize(true)
              .size([10,20])
              .shape("square")
              .text(s.__data__._metadata.series.caption)
              .width(bb.width)
              .height(bb.height)
              .padding(4)
              .x(bb.x + 4)
              .y(bb.y + 4)
              .draw();

            var pctLabel = labels.append('text')
                  .attr('fill', dark ? '#212121' : 'white');
            d3plus.textwrap()
              .container(pctLabel)
              .resize(true)
              .size([5,15])
              .shape("square")
              .text(Math.round((s.__data__.value / scope.totalTreeMap) * 100) + '%')
              .width(bb.width)
              .height(bb.height)
              .x(bb.x)
              .y(bb.y - 5)
              .valign('bottom')
              .align('center')
              .draw();

            // if nameLabel takes most of container space, remove pct label
            var bbn = nameLabel.node().getBBox();
            if (bbn.width === 0 || (bbn.height / bb.height) > 0.5) {
              pctLabel.remove();
            }
          });
        }

        function highlightSelection (selections) {
          if (_.isUndefined(selections)) {
            plot.selections()
              .classed('hovered', false);
          } else {
            selections
              .classed('hovered', true);
          }
        }

        tm.children = buildChildren(scope.model.selectedDateTick);
        scope.totalTreeMap = _.sum(_.pluck(tm.children, 'value'));

        var xScale = new Plottable.Scales.Linear(),
            yScale = new Plottable.Scales.Linear(),
            plot = new Plottable.Plots.Rectangle()
                .x(function(d) { return d.x; }, xScale)
                .y(function(d) { return d.y; }, yScale)
                .x2(function(d) { return d.x + d.dx; }, xScale)
                .y2(function(d) { return d.y + d.dy; }, yScale)
              .attr('fill', function(d) { return d._metadata.series.color; })
              .animated(true)
              .attr('stroke', '#fafafa');

        plot.datasets(buildDatasets(tm));

          plot.renderTo(d3.select(element[0]).select('svg'));
          plot.renderImmediately();
          placeLabels(plot);

        $timeout(function(){
          placeLabels(plot);
        });

        new Plottable.Interactions.Pointer()
            .onPointerMove(function(point) {
              var entity = plot.entitiesAt(point)[0];
              if (!_.isUndefined(entity)) {
                highlightSelection();
                scope.highlightItem();
                highlightSelection(entity.selection);
                scope.highlightItem({
                  caption: entity.datum._metadata.series.caption,
                  measures: entity.datum.measures,
                  selection: entity.selection
                });
              }
            })
            .onPointerExit(function() {
              highlightSelection();
              scope.highlightItem();
            })
            .attachTo(plot);

        new Plottable.Interactions.Click()
            .onClick(function(point) {
              scope.drillDown(plot.entitiesAt(point)[0].datum._metadata.series);
            })
            .attachTo(plot);

        d3.select(window).on('resize', function  () {
          $timeout(function() {
            plot.redraw();
          });
        });

        scope.$watch('legendOpen', function () {
          plot.redraw();
        });

        scope.$watch('highlighted.serie', function (serie) {
          if (_.isUndefined(serie)) {
            highlightSelection();
            scope.highlightItem();
            return;
          }

          var entity = d3.select(_.find(plot.selections()[0],
                                        function(s) {
                                          return s.__data__._metadata.series.key === serie.key;
                                        }));

          highlightSelection(entity);

          scope.highlightItem({
            caption: entity.datum()._metadata.series.caption,
            measures: entity.datum().measures,
            selection: entity
          });

        });

        scope.$watch('model.selectedDateTick', function(timeIndex) {
          tm.children = buildChildren(timeIndex);

          plot.datasets(buildDatasets(tm));
          scope.totalTreeMap = _.sum(tm.children, 'value');
        });
      }
    };
  });
