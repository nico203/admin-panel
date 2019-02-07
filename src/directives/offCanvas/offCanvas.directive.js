angular.module('adminPanel').directive('apOffCanvas', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                elem.addClass('off-canvas');
                $timeout(function() {
                    elem.foundation();
                });
            }
        };
    }
]);

