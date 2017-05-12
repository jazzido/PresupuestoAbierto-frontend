'use strict';

/**
 * @ngdoc service
 * @name frontendApp.search
 * @description
 * # search
 */
angular.module('frontendApp')
  .factory('SearchService', function ($http, settings, CubesService, $q) {
    var API_URL = settings.API_URL;

    return {
      autocomplete_members: function(query) {
        var deferred = $q.defer();

        $http.get(API_URL + 'search/' + settings.SITE_ID + '/' + CubesService.cube.name,
                  { params: { q: query }})
          .then(function(res) {
            return deferred.resolve(res.data.results);
          });

        return deferred.promise;
      }
    };
  });
