'use strict';

/**
 * @ngdoc service
 * @name frontendApp.settings
 * @description
 * # settings
 * Service in the frontendApp.
 */
angular.module('frontendApp')
  .service('settings', function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var API_URL = '//api.openrafam:9090/';

    // calcular el endpoint del API

    if (window.API_HOST !== undefined) {
      API_URL = '//' + window.API_HOST;
      //if (window.location.port !== '') {
      //  API_URL += ':' + window.location.port;
      //}
      API_URL += '/';
    } else {
      API_URL = 'http://api.openrafam.nerdpower.org:9090/';
    }

    this.frontend_settings = {};

    return {
      API_URL: API_URL,
      SITE_ID: window.SITE_ID || 'bahia',
      CSCALE: [
        'rgb(166,206,227)',
        'rgb(31,120,180)',
        'rgb(178,223,138)',
        'rgb(51,160,44)',
        'rgb(251,154,153)',
        'rgb(227,26,28)',
        'rgb(253,191,111)',
        'rgb(255,127,0)',
        'rgb(202,178,214)',
        'rgb(106,61,154)',
        'rgb(255,255,153)',
        'rgb(177,89,40)'
      ]
    };
  });
