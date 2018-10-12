angular.module('adminPanel').directive('apTabs',[
    '$location', '$timeout', '$interval', '$window',
    function($location, $timeout, $interval, $window) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                onChange: '&'
            },
            link: function($scope, elem, attr) {
                $scope.tabs = {}; //Lista de tabs
                $scope.allowScrollToLeft = false;
                $scope.allowScrollToRight = true;
                $scope.enableScrollButtons = false;

                var tabsElement = elem.find('.tabs');
                var scrollDuration = 500;
                var scrollPromise;

                enableOrDisableScrollButtons();

                tabsElement.bind('scroll', function() {
                    showOrHideScrollButtons();
                });

                angular.element($window).bind('resize', function() {
                    enableOrDisableScrollButtons();
                });

                /**
                 * Cambia el estado de un Tab
                 * @param {Object} tab
                 * @return {undefined}
                 */
                $scope.switch = function (tab) {
                    if (tab.state === 'default') {
                        $timeout(function() {
                            if ($scope.active !== tab.name) {
                                $scope.active = tab.name;
                                $location.hash(tab.name);
                                if ($scope.onChange) {
                                    $scope.onChange();
                                }
                            }
                        });
                    }
                };

                /**
                 * Permite que cambie el tab activo al cambiar el hash de  la ruta
                 */
                $scope.$on('$routeUpdate', function() {
                    if($location.hash() in $scope.tabs) {
                        $timeout(function() {
                            $scope.active = $location.hash();
                        });
                    }
                });

                $scope.scrollToLeft = function() {
                    scroll(getScrollStep() * -1);
                };

                $scope.scrollToRight = function() {
                    scroll(getScrollStep());
                };

                $scope.mouseUp = function () {
                    $interval.cancel(scrollPromise);
                    scrollPromise = null;
                };

                /**
                 * Calcula el paso del scroll a partir del tamaño del elemento html
                 */
                function getScrollStep() {
                    return tabsElement[0].scrollWidth / Math.ceil(tabsElement[0].scrollWidth / tabsElement[0].clientWidth);
                }

                /**
                 * Habilita o deshabilita los botones de scroll dependiendo del tamaño
                 * del elemento html.
                 */
                function enableOrDisableScrollButtons() {
                    $timeout(function() {
                        if (tabsElement[0].clientWidth < tabsElement[0].scrollWidth) {
                            $scope.enableScrollButtons = true;
                        } else {
                            $scope.enableScrollButtons = false;
                        }
                    });
                }

                /**
                 * Oculta o no los botones de desplazamiento dependiendo del scroll
                 * actual del elemento.
                 */
                function showOrHideScrollButtons() {
                    $timeout(function() {
                        var scrollLeft = tabsElement.scrollLeft();
                        
                        if (scrollLeft <= 0) {
                            $scope.allowScrollToLeft = false;
                        } else {
                            $scope.allowScrollToLeft = true;
                        }

                        if (scrollLeft >= tabsElement[0].scrollLeftMax) {
                            $scope.allowScrollToRight = false;
                        } else {
                            $scope.allowScrollToRight = true;
                        }
                    });
                }

                /**
                 * Realiza el desplazamiento del elemento tabs.
                 * @param {int} step cantidad de píxeles que debe desplazarse el 
                 * elemento
                 */
                function scroll(step) {
                    tabsElement.scrollLeftAnimated(
                        tabsElement.scrollLeft() + step, scrollDuration
                    );

                    if(scrollPromise) {
                        $interval.cancel(scrollPromise);
                    }

                    scrollPromise = $interval(function () {
                        tabsElement.scrollLeftAnimated(
                            tabsElement.scrollLeft() + step, scrollDuration
                        );
                    }, scrollDuration);
                }

            },
            controller: ['$scope', function($scope) {

                /**
                 * Registra o actualiza un Tab
                 * @param {String} name
                 * @param {String} title
                 * @return {undefined}
                 */
                this.register = function(name, title, state, endIcon) {
                    $scope.tabs[name] = {
                        name: name, 
                        title: title || name,
                        state: state || 'default',
                        endIcon: endIcon || null
                    };
                    if (!$scope.active && state!='disabled') {
                        $scope.active = name;
                    }
                    if ($location.hash() === name && state !== 'disabled') {
                        $scope.active = name;
                    }
                };

                /**
                 * Verifica si el Tab con nombre "name" esta activo
                 * @param {String} name
                 * @return {Boolean} active
                 */
                this.isActive = function(name) {
                    return $scope.active === name;
                };

            }],
            templateUrl: 'directives/tabs/tabs.template.html'
        };
    }
]);