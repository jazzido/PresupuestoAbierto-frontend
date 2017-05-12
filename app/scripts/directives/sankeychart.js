'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:sankeyChart
 * @description
 * # sankeyChart
 */

angular.module('frontendApp')
  .directive('sankeyChart', function (settings, $timeout) {
    return {
      templateUrl: 'views/directives/sankeyChart.html',
      restrict: 'E',
      replace: true,
      link: function postLink(scope, element) {

        var svgNode = d3.select(element[0]).select('svg');

        if(scope.aggregate.secondarySeries === null) {
          scope.setSecondaryDimension();
          return;
        }

        // XXX TODO time_idx tiene que cambiar
        // segun el slider de tiempo
        var time_idx = 0;
        var compactMap = _.compose(_.compact, _.map);

        // armar la lista de nodos source y target
        // de acuerdo a las dimensiones principal y secundaria
        var sankeyData = {
          nodes: scope.aggregate.series.concat(scope.aggregate.secondarySeries),
          links: compactMap(scope.aggregate.datasets,
                            function(ds, idx) {
                              var series_idx = Math.floor(idx / scope.aggregate.secondarySeries.length),
                                  sec_series_idx = idx % scope.aggregate.secondarySeries.length,
                                  rv = null;

                              if (ds[time_idx].value !== null && ds[time_idx].value !== 0) {
                                rv = {
                                  source: series_idx,
                                  target: scope.aggregate.series.length + sec_series_idx,
                                  value: ds[time_idx].value
                                };
                              }
                              return rv;
                            })
        };

        scope.totalSankey = _.sum(sankeyData.links, 'value');

        var redraw = function() {
          var n = svgNode.node();
          while(n.firstChild) {
            n.removeChild(n.firstChild);
          }
          chart();
        };

        var chart = function() {
          var margin = {top: 1, right: 1, bottom: 1, left: 1},
              width = svgNode.node().parentNode.offsetWidth - margin.left - margin.right,
              height = svgNode.node().parentNode.offsetHeight - margin.top - margin.bottom,
              svg = svgNode.append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
              sankey = d3.sankey()
                .nodeWidth(25)
                .nodePadding(5)
                .size([width, height]),
              path = sankey.link();

          svgNode
            .attr('width', '100%')
            .attr('height', '100%');

          sankey.nodes(sankeyData.nodes)
            .links(sankeyData.links)
            .layout(64);

          svg.append("g").selectAll(".link")
                .data(sankeyData.links)
                .enter()
                .append("path")
                .attr("class", "link")
                .attr("d", path)
                .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                .sort(function(a, b) { return b.dy - a.dy; })
                .on('mouseover', function() {
                  console.log('mouseover link', d3.select(this).data());
                })
                .on('mouseout', function() {
                  console.log('mouseout link', d3.select(this).data());
                });

          var node = svg.append("g").selectAll(".node")
                .data(sankeyData.nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform",
                      function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                      })
                .on('mouseover', function() {
                  console.log('mouseover node', d3.select(this).data());
                })
                .on('mouseout', function() {
                  console.log('mouseout node', d3.select(this).data());
                });

          node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", _.property('color'))
            .append("title")
            .text(function(d) { return d.name + "\n" + d.value; });

          return svgNode;
        };

        $timeout(redraw);

        d3.select(window).on('resize', function  () {
          $timeout(redraw);
        });
      }
    };
  });
