'use strict';

/**
 * @ngdoc overview
 * @name frontendApp
 * @description
 * # frontendApp
 *
 * Main module of the application.
 */

angular
  .module('frontendApp', [
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngMaterial',
    'ui.router',
    'md.data.table',
    'ui.router.title'
  ])
  .config(function ($stateProvider, $urlRouterProvider, $logProvider, $locationProvider) {

    $logProvider.debugEnabled(false);
    $locationProvider.html5Mode(window.HTML5_MODE === true); // see nginx/conf/frontend.conf

    var redirectIndex = function(CubesService, settings, $location) {
      return CubesService.getUserCubes().then(function (cubes) {
        var default_cube = settings.frontend_settings.default_cube ?
              _.find(cubes, { id: settings.frontend_settings.default_cube }) :
            cubes[0];
        return $location.path('/' + default_cube.id);
      });
    };

    if (window.HTML5_MODE) {
      $urlRouterProvider.when('/',
                              ['CubesService', 'settings', '$location', redirectIndex]);
    }
    else {
      $urlRouterProvider.otherwise(function($injector, $location){
        var CubesService = $injector.get('CubesService');
        var settings = $injector.get('settings');
        return redirectIndex(CubesService, settings, $location);
      });
    }

    $stateProvider
      .state('main', {
        abstract: true,
        template: '<ui-view/>',
        url: '/{cubeId:[0-9a-zA-Z\-_]+}',
        controller: 'MainCtrl as main',
        resolve: {
          Cube : function(CubesService, $stateParams){
            return CubesService.getCube($stateParams.cubeId);
          },
          Cubes : function(CubesService){
            return CubesService.getUserCubes();
          },
          $title: function() { return 'Home'; }
        },
        views: {
          '': {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl as main'
          },
          'sidenav@main': {
            templateUrl: 'views/partials/sidenav.html',
            controller: 'SidenavCtrl as ctrl'
          },
          'toolbar': {
            templateUrl: 'views/toolbar.html',
            controller: 'ToolbarCtrl as ctrl'
          }
        }
      })
      .state('main.dimension', {
        // changes in dimension, level, members, date, breakdown
        // trigger a call to the aggregator API
        url: '?dimension&level&members&date&breakDown&breakDownMember',
        abstract: true,
        template: '<div flex layout="column" ui-view layout-padding></div>',
        controller: 'RightCtrl',
        resolve: {
          aggregate:  function(CubesService, $stateParams, Cube){
            var dimension = $stateParams.dimension || _.first(_.reject(Cube.dimensions, 'type', 'time')).name;

            var agg = CubesService.getCubeAggregate({
              cubeId: Cube.name,
              dimension: dimension,
              members: $stateParams.members,
              level: $stateParams.level,
              breakDown: $stateParams.breakDown,
              breakDownMember: $stateParams.breakDownMember,
              date: $stateParams.date
            });
            return agg;
          },
          $title: ['CubesService', 'aggregate', '$stateParams', function(CubesService, aggregate, $stateParams) {
            if (!$stateParams.level) {
              return aggregate.dimension;
            }
            else {
              return CubesService.getMember($stateParams)
                .then(function(member) {
                  return member.name;
              });
            }
          }]
        }
      })
      .state('main.dimension.chart', {
        url: '?chart&percent&measures&dateTick',
        params: {
          chart: 'barchart'
        },
        views: {
          '': {
            templateUrl: 'views/right.html',
            controller: 'RightCtrl'
          },
          'chart@main.dimension.chart': {
            templateUrl: 'views/chart.html',
            controller: 'ChartCtrl as main'
          },
          'legend@main.dimension.chart': {
            templateUrl: 'views/legend.html',
            controller: 'LegendCtrl as legendCtrl'
          },
          'header@main.dimension.chart': {
            templateUrl: 'views/partials/right_header.html',
            controller: 'RightheaderCtrl as ctrl'
          },
          'filters@main': {
            templateUrl: 'views/partials/filters.html',
            controller: 'FiltersCtrl as ctrl'
          }
        }
      });
  })
  .run(['$rootScope', '$window', function($rootScope, $window) {

    $rootScope.$on('$stateChangeStart',function(){
      $rootScope.stateIsLoading = true;
    });

    $rootScope.$on('$stateChangeSuccess',function() {
      $rootScope.stateIsLoading = false;
      if (!$window.ga) {
        return;
      }
      $window.ga('send', 'pageview',
                 {
                   page: $window.location.pathname + $window.location.search  + $window.location.hash
                 });
    });

    $rootScope.$on("$stateChangeError", function() {
      console.log('statechangeerror', arguments);
    });
  }]);
