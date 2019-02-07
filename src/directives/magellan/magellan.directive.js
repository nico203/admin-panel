/**
 * @description Magellan
 */
angular.module('adminPanel').directive('apMagellan',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                items: '<',
                title: '@'
            },
            link: function($scope, element, attr) {

                /**
                 * Eliminar los items que referencian a un id que no existe.
                 */
                function filterItems() {
                    for (var key in $scope.items) {
                        if ($scope.items[key] && !angular.element('#' + $scope.items[key]).length) {
                            delete $scope.items[key];
                        }
                    }
                }

                $scope.$on('magellan:filterItems', function(e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    $timeout(filterItems);
                });
            },
            templateUrl: 'directives/magellan/magellan.template.html'
        };
    }
]);