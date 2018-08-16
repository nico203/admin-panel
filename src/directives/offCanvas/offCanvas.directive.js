angular.module('adminPanel').directive('apOffCanvas', [
    function() {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                elem.addClass('off-canvas');
                if (!elem.foundation) {
                    elem.foundation();
                }
            }
        };
    }
]);

