'use strict';

/**
 * @ngdoc directive
 * @name frontendApp.directive:helpTooltip
 * @description
 * # help tooltip (for the question mark icons)
 */

angular.module('frontendApp')
  .directive('helpTooltip', function (settings, $window, $mdUtil, $document, $timeout) {
    return {
      templateUrl: 'views/directives/helpTooltip.html',
      restrict: 'E',
      replace: false,
      transclude: true,
      link: function(scope, element, attrs, ctrl, transclude) {
        var parent,
            tooltipParent = angular.element(document.body),
            TOOLTIP_WINDOW_EDGE_SPACE = 12;

        transclude(scope, function(clone) {
          element.children().children().append(clone);
        });

        function getParentWithPointerEvents () {
          var parent = element.parent();
          while (parent && hasComputedStyleValue('pointer-events','none', parent[0])) {
            parent = parent.parent();
          }
          return parent;
        }

        function configureWatchers () {
          scope.$watch('visible', setTooltipVisible);
        }

        function setVisible (value) {
          setVisible.value = !!value;
          if (!setVisible.queued) {
            if (value) {
              setVisible.queued = true;
              $timeout(function() {
                scope.visible = setVisible.value;
                setVisible.queued = false;
              }, scope.delay);
            } else {
              $mdUtil.nextTick(function() { scope.visible = false; });
            }
          }
        }

        function hasComputedStyleValue(key, value, target) {
          key    = attrs.$normalize(key);
          target = target || element[0];

          var computedStyles = $window.getComputedStyle(target);

          return angular.isDefined(computedStyles[key]) && (computedStyles[key] === value);
        }

        function positionTooltip() {
          var tipRect = $mdUtil.offsetRect(element, tooltipParent),
              parentRect = $mdUtil.offsetRect(parent, tooltipParent),
              position = {
                left: parentRect.left + parentRect.width + TOOLTIP_WINDOW_EDGE_SPACE,
                top: parentRect.top + parentRect.height / 2 - tipRect.height / 2
              },
              newPosition;

          function fitInParent (pos) {
            var newPosition = { left: pos.left, top: pos.top };
            newPosition.left = Math.min( newPosition.left, tooltipParent.prop('scrollWidth') - tipRect.width - TOOLTIP_WINDOW_EDGE_SPACE );
            newPosition.left = Math.max( newPosition.left, TOOLTIP_WINDOW_EDGE_SPACE );
            newPosition.top  = Math.min( newPosition.top,  tooltipParent.prop('scrollHeight') - tipRect.height - TOOLTIP_WINDOW_EDGE_SPACE );
            newPosition.top  = Math.max( newPosition.top,  TOOLTIP_WINDOW_EDGE_SPACE );
            return newPosition;
          }

          newPosition = fitInParent(position);

          element.css({
            top: newPosition.top + 'px',
            left: newPosition.left + 'px'
          });

        }

        function bindEvents () {
          var mouseActive = false;
          var enterHandler = function() {
            parent.on('blur mouseleave touchend touchcancel', leaveHandler );

            setVisible(true);
          };
          var leaveHandler = function () {
            if (mouseActive || ($document[0].activeElement !== parent[0]) ) {
              parent.off('blur mouseleave touchend touchcancel', leaveHandler );
              setVisible(false);
            }
            mouseActive = false;
          };

          // to avoid `synthetic clicks` we listen to mousedown instead of `click`
          parent.on('mousedown', function() { mouseActive = true; });
          parent.on('focus mouseenter touchstart', enterHandler );
        }

        function setTooltipVisible(show) {
          element.css('visibility', show ? 'visible': 'hidden');
          if (show) {
            tooltipParent.append(element);
          }
          else {
            element.detach();
          }
          positionTooltip();
        }

        parent = getParentWithPointerEvents();
        bindEvents();
        configureWatchers();
      }
    };
  });
