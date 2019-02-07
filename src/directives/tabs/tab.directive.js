angular.module('adminPanel').directive('apTab',[
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                name: '@',
                title: '@',
                state: '@',
                endIcon: '<'
            },
            require: '^apTabs',
            link: function($scope, elem, attr, tabsCtrl) {

                if (!$scope.name) {
                    console.error('Tab directive requires "name" attribute.');
                    return;
                }

                $scope.loadedContent = false; //Indica si su contenido ya fue cargado en el DOM

                /**
                 * Indica si la pestaña debe o no mostrar su contenido
                 * @return {Boolean} isVisible
                 */
                $scope.isVisible = function() {
                    return tabsCtrl.isActive(attr.name);
                };

                /**
                 * Indica si la pestaña fue abierta al menos una vez
                 * @return {Boolean} wasOpened
                 */
                $scope.wasOpened = function() {
                    if (!$scope.loadedContent && tabsCtrl.isActive(attr.name)) {
                        $scope.loadedContent = true;
                    }
                    return $scope.loadedContent;
                };

                /**
                 * Watcher para actualizar los datos
                 * @return {Boolean}
                 */
                $scope.$watchGroup(['title', 'state', 'endIcon'], function(newValues, oldValues) {
                    tabsCtrl.register($scope.name, newValues[0], newValues[1], newValues[2]);
                });
            },
            templateUrl: 'directives/tabs/tab.template.html'
        };
    }
]);