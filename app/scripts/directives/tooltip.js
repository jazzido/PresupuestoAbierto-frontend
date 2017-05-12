'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:tooltip
 * @description
 * # tooltip
 */

angular.module('frontendApp')
  .directive('tooltip', function () {
    return {
      templateUrl: 'views/directives/tooltip.html',
      restrict: 'E',
      scope: {
        member: '=',
        measure: '='
      },
      replace: true,
      transclude: true,
      link: function postLink(scope, element, attrs, ctrl, transclude) {
        var offsetParent;

        if (_.has(attrs, 'offsetparentselector')) {
          offsetParent = document.querySelector(attrs.offsetparentselector);
        }
        else {
          offsetParent = element.parent()[0];
        }

        transclude(scope, function(clone, scope) {
          element.append(clone);
        });

        var offsetFrom = function(element, origin) {
          var originRect = origin.getBoundingClientRect(),
              elementRect = element.getBoundingClientRect();

          return {
            left: elementRect.left - originRect.left,
            top: elementRect.top - originRect.top,
            width: elementRect.width,
            height: elementRect.height
          };
        };

        var tooltipShow = function(item) {
          if (_.has(attrs, 'key')) {
            item = item[attrs.key];
          }
          if (angular.isDefined(item)) {
            var tooltipRect = element[0].getBoundingClientRect();

            var entityBoundingRect = offsetFrom(item.selection[0][0],
                                                offsetParent),
                tooltipTop = (entityBoundingRect.top - tooltipRect.height - 11);

            if (tooltipTop < 0) { // use upward pointing arrow
              element.toggleClass('arrow_top', true);
              element.toggleClass('arrow_bottom', false);
              tooltipTop = entityBoundingRect.top + 11;
            }
            else {
              element.toggleClass('arrow_top', false);
              element.toggleClass('arrow_bottom', true);
            }

            element.css({
              top: tooltipTop + 'px',
              left: (entityBoundingRect.left + entityBoundingRect.width/2 - tooltipRect.width/2) + 'px'
            });
            element.css('visibility', 'visible');
            scope.item = item;
          } else {
            element.css('visibility', 'hidden');
          }
        };

        scope.$watch('member', tooltipShow);
      }
    };
  });
