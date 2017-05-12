'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:RightheaderCtrl
 * @description
 * # RightheaderCtrl
 * Controller of the frontendApp
 */
angular.module('frontendApp')
  .controller('RightheaderCtrl', function (aggregate, $state, $stateParams, $scope, CubesService) {

    $scope.timeDim = aggregate.timeDim;
    $scope.timeParam = $stateParams.date;

    if (_.isNull($stateParams.level) || _.isUndefined($stateParams.level)) {
      var allMember = _.find(CubesService.cube.dimensions,
                             function(d) { return d.name === aggregate.dimension; })
            .hierarchies[0].all_member_name;
      $scope.ancestors = [
        {
          caption: allMember,
          level: null,
          members: null
        }
      ];
    }
    else {
      CubesService.getMember($stateParams).then(function(member) {
        $scope.ancestors = _.map(member.ancestors.slice().reverse(),
                                 function(a) {
                                   return {
                                     caption: a.caption,
                                     level: a.depth > 0 ? aggregate.hierarchies[a.depth].name : null,
                                     members: a.depth > 0 ? a.key : null
                                   };
                                 });
        $scope.ancestors.push(member);
      });
    }

    if (!_.isUndefined($stateParams.level)) {
      // drilled down in one dimension, show next level
      var dim = _.find(CubesService.cube.dimensions,
                       function(d) { return d.name === $stateParams.dimension; }),
          lvls = dim.hierarchies[0].levels.slice(dim.hierarchies[0].has_all ? 1 : 0),
          curLvl = _.findIndex(lvls,
                               function(d) { return d.name === $stateParams.level; });

      $scope.breakDownSelector = [
        _.assign({level: true}, lvls[curLvl + 1]),
      ].concat(_.reject(CubesService.cube.dimensions,
                        function(d) {
                          return d === dim || d.type === 'time';
                        }));

      if (_.isUndefined($stateParams.breakDown)) {
        $scope.breakDown = $scope.breakDownSelector[0];
        $scope.breakDownParam = null;
      }
      else {
        $scope.breakDown = _.find(
          $scope.breakDownSelector,
          { name: $stateParams.breakDown.split('.')[0] }
        );

        $scope.breakDownParam = {
          breakDown: [
            $scope.breakDown.name,
            $scope.breakDown.hierarchies[0].levels[dim.hierarchies[0].has_all ? 1 : 0].name
          ].join('.'),
          breakDownMember: $stateParams.breakDownMember
        };
      }
    }

    $scope.changeBreakDown = function(bd) {
      if (!bd.level) {
        $scope.breakDownParam = {
          breakDown: [
            bd.name,
            bd.hierarchies[0].levels[dim.hierarchies[0].has_all ? 1 : 0].name
          ].join('.')
        };
        $state.go('main.dimension.chart',
                  {
                    breakDown: $scope.breakDownParam.breakDown,
                    breakDownMember: null
                  });
      }
      else { // remove breakdown
        $scope.breakDownParam = null;
        $state.go('main.dimension.chart',
                  {
                    breakDown: null,
                    breakDownMember: null
                  });
      }
    };
  });
