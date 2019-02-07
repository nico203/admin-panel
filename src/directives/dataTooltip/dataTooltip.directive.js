/**
 * @description Foundation tooltip.
 */
angular.module('adminPanel').directive('apDataTooltip', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                
                element.attr('data-tooltip', '');

                $timeout(function() {
                    element.foundation();
                });
            }
        };
    }
]);