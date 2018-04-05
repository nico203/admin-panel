/*angular.module('adminPanel').directive('hamburger', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'AE',
            link: function (scope, elem, attr) {
                elem.addClass('hambruger-wrapper');
                
                var toggleClickElement = function() {
                    $('#hamburger-icon').toggleClass('active');
                    return false;
                };
                
                elem.on('click', toggleClickElement);
                $(document).on('closed.zf.offcanvas', toggleClickElement);
                
                scope.$on('$destroy', function() {
                    $(document).off('closed.zf.offcanvas', toggleClickElement);
                    elem.off('click', toggleClickElement);
                });
            },
            templateUrl: 'directives/hamburger/hamburger.template.html'
        };
    }
]);*/