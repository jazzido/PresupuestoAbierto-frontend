"use strict";

/**
 * @ngdoc service
 * @name frontendApp.cubes
 * @description
 * # cubes
 * Service in the frontendApp.
 */
angular
  .module("frontendApp")
  .factory("CubesService", function($http, settings, $q, $window, $log) {
    var API_URL = settings.API_URL;

    var srv = {
      cube: null,
      cubes: undefined,
      lastURL: undefined,
      lastParams: undefined
    };

    function serialize(obj) {
      var str = [];

      for (var p in obj) {
        if (obj.hasOwnProperty(p) && angular.isDefined(obj[p])) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      }
      return str.join("&");
    }

    function aggregateToSeries(aggregate, axisIndex) {
      axisIndex = axisIndex === undefined ? 0 : axisIndex;
      var mainDimIdx = _.findIndex(aggregate.axis_dimensions, {
        type: "standard"
      });
      var series = aggregate.axes[mainDimIdx].members;

      return _.map(
        _.uniq(series, false, function(d) {
          // fucking javascript que no soporta chequeo
          // de igualdad en objetos
          return JSON.stringify(_.pick(d, ["name", "key"]));
        }),
        function(s, idx) {
          return _.extend(s, {
            color: settings.CSCALE[idx % settings.CSCALE.length]
          });
        }
      );
    }

    function getDimension(cube, dimensionName) {
      return _.find(cube.dimensions,
                    function(d) {
                      return d.name === dimensionName;
                    });
    }

    srv.getLastUrl = function() {
      return srv.lastURL + ".xls?" + serialize(srv.lastParams);
    };

    srv.getCube = function(name) {
      return $http.get(API_URL + "cubes/" + name).then(function(res) {
        srv.cube = res.data;
        return res.data;
      });
    };

    srv.getUserCubes = function(user) {
      var deferred = $q.defer();
      user = user || settings.SITE_ID;

      if (angular.isDefined(srv.cubes)) {
        deferred.resolve(srv.cubes);
      } else {
        $http.get(API_URL + "users/" + user).then(
          function(res) {
            settings.frontend_settings = res.data.frontend_settings;
            srv.cubes = res.data.cubes;

            return deferred.resolve(res.data.cubes);
          },
          function(rejection) {
            deferred.reject(rejection);
          }
        );
      }
      return deferred.promise;
    };

    srv.getMember = function(params) {
      var deferred = $q.defer();
      var url =
        API_URL +
        "cubes/" +
        params.cubeId +
        "/dimensions/" +
        params.dimension +
        "/levels/" +
        params.level +
        "/members/" +
        params.members;

      $http.get(url, { cache: true }).then(
        function(res) {
          return deferred.resolve(res.data);
        },
        function(rejection) {
          deferred.reject(rejection);
        }
      );
      return deferred.promise;
    };

    srv.getCubeAggregate = function(params) {
      // si level es null, buscamos el primer nivel
      // de la hierarchy
      var level = params.level;
      var levelIdx;

      var d = _.find(srv.cube.dimensions, function(d) {
        return d.name === params.dimension;
      });

      if (angular.isUndefined(level)) {
        level = d.hierarchies[0].levels[d.hierarchies[0].has_all ? 1 : 0].name;
      }
      else {
        levelIdx = _.findIndex(d.hierarchies[0]
                               .levels,
                               function (l) {
                                 return l.name === level;
                               });
      }

      var timeDimension = _.find(srv.cube.dimensions, function(d) {
        return d.type === "time";
      });
      var timeDd = [
        timeDimension.name,
        timeDimension.hierarchies[0].levels[1].name
      ].join("."); // always drilldown by time

      var cutLevel = null;

      if (!_.isUndefined(params.members) && !angular.isUndefined(level)) {
        cutLevel = d.hierarchies[0].levels[levelIdx + 1];
      }

      var query = {
        "measures[]": _.pluck(srv.cube.measures, "name"), // get every defined measure
        date: params.date, // XXX TODO
        nonempty: "true"
      };

      // XXX TODO this is bullshit
      // take care of this when I refactor aggregator to make it look
      // like Python Cubes
      if (angular.isUndefined(params.breakDown)) {

        query = _.assign(query, {
          "drilldown[]": [
            cutLevel === null ? [params.dimension, level].join(".") : [params.dimension, cutLevel.name].join("."),
            timeDd
          ],
          "cut[]": cutLevel === null
            ? undefined
            : "[" + [params.dimension, level].join("].[") + "].&[" + $window.decodeURIComponent(params.members) + "]"
        });
      } else {
        // if there's a breakDown, juggle things around
        query = _.assign(query, {
          where: [
            [
              params.dimension,
              level,
              $window.decodeURIComponent(params.members)
            ].join(".")
          ],
          "cut[]": "[" + [params.dimension, level].join("].[") + "].&[" + $window.decodeURIComponent(params.members) + "]",
          "drilldown[]": [params.breakDown, timeDd]
        });
      }

      srv.lastURL = API_URL + "cubes/" + params.cubeId + "/aggregate";
      srv.lastParams = query;
      srv.downloadURL = srv.getLastUrl();

      srv.promise = $http.get(
        API_URL + "cubes/" + params.cubeId + "/aggregate",
        {
          params: query,
          cache: true
        }
      );

      return srv.promise.then(function(response) {
        var data = response.data;

        var datasets = _.unzip(_.map(_.unzip(data.values), _.unzip)),
          series = aggregateToSeries(data, 0),
          mNames = _.pluck(srv.cube.measures, "name"), // measure names
          timeAxisIdx = _.findIndex(data.axis_dimensions, { type: "time" }),
          timeDim = data.axis_dimensions[timeAxisIdx],
          tKeys = _.pluck(data.axes[timeAxisIdx].members, "name"); // time member keys
        var timeTotals = tKeys.map(function(t, j) {
          // totals by time
          return _.object(
            mNames,
            _.map(mNames, function(mn, i) {
              return _.sum(
                _.map(series, function(s, k) {
                  return datasets[i][k][j];
                })
              );
            })
          );
        });

        srv.timeScale = srv.cube.dimensions[timeAxisIdx];

        var annotatedDatasets = _.map(series, function(m, k) {
          return _.map(data.axes[timeAxisIdx].members, function(t, j) {
            var measures = _.object(
              mNames,
              _.map(mNames, function(mn, i) {
                return datasets[i][k][j];
              })
            );

            return {
              measures: measures,
              time: t,
              percent: _.object(
                mNames,
                _.map(mNames, function(m, i) {
                  return measures[m] / timeTotals[j][m];
                })
              )
            };
          });
        });

        srv.hierarchies = _.result(
          _.find(srv.cube.dimensions, "name", params.dimension),
          "hierarchies[0].levels"
        );

        return {
          datasets: annotatedDatasets,
          series: series,
          hierarchies: srv.hierarchies,
          dimension: params.dimension,
          timeTicks: data.axes[timeAxisIdx].members,
          timeTotals: timeTotals,
          timeDim: timeDim
        };
      });
    };

    return srv;
  });
