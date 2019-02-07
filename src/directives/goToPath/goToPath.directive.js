/**
 * @description Atributo que redirecciona con el evento de click.
 *              Similar al atributo href del elemento <a>.
 */
angular.module('adminPanel').directive('apGoToPath', [
    '$location',
    function ($location) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                var path;

                attrs.$observe('apGoToPath', function (val) {
                    path = val;
                });

                element.bind('click', function () {
                    scope.$apply(function () {
                        $location.path(path);
                    });
                });
            }
        };
    }
]);