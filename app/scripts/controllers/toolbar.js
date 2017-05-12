'use strict';

/**
 * @ngdoc function
 * @name frontendApp.controller:ToolbarCtrl
 * @description
 * # ToolbarCtrl
 * Controller of the frontendApp
 */

function DialogController($scope, $mdDialog, $sanitize, content) {
  $scope.content = content;
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}

angular.module('frontendApp')
  .controller('ToolbarCtrl', function ($scope, $mdSidenav, settings,
                                       $window, $state, CubesService, SearchService,
                                       $mdDialog, $sce) {

    this.toggleSidebar = function () {
      $mdSidenav('left').toggle();
    };

    this.curLocation = function() {
      return encodeURIComponent($window.location.toString());
    };

    this.sharePopup = function(url) {
      $window.open(url, '', 'top=300,left=550,width=800,height=380');
    };

    this.downloadXLS = function () {
        var url = CubesService.getLastUrl();
        $window.open(url);
    };

    this.autocompleteSearch = function() {
      var l = SearchService.autocomplete_members(this.searchText);
      return l;
    };

    this.autocompleteSearchChanged = function() {
      if (_.isUndefined(this.selectedItem)) {
        return;
      }

      $state.go('main.dimension.chart',
                {
                  members: this.selectedItem.properties.key,
                  level: this.selectedItem.properties.level,
                  dimension: this.selectedItem.properties.dimension,
                  breakDown: null,
                  breakDownMember: null
                });
    };

    var dialogContent = {
      title: settings.frontend_settings.about_dialog.title,
      content: $sce.trustAsHtml(settings.frontend_settings.about_dialog.content)
    };

    this.showAboutDialog = function(ev) {
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'views/partials/about_dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        locals: {
          content: dialogContent
        }
      });
    };
    $scope.settings = settings;
  });
