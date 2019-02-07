angular.module('adminPanel').directive('apTabs',[
    '$location', '$timeout', '$window',
    function($location, $timeout, $window) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                onChange: '&'
            },
            link: function($scope, elem) {
                $scope.tabs = {};
                $scope.active = null;
                $scope.allowScrollToLeft = false;
                $scope.allowScrollToRight = true;
                $scope.enableScrollButtons = false;
                
                var tabsElement = elem.find('.tabs');
                var scrollDuration = 700;

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
                        $scope.scrollToElement($location.hash());
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
                            $scope.scrollToElement($location.hash());
                        });
                    }
                });

                $scope.scrollToLeft = function() {
                    scroll(getScrollStep() * -1);
                };

                $scope.scrollToRight = function() {
                    scroll(getScrollStep());
                };

                $scope.scrollToElement = function(tabName) {
                    $timeout(function() {
                        var tabElement = angular.element(document.getElementById('tab-' + tabName));
                        scroll(null, tabElement);
                    });
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
                 * @param {DOMElement} element elemento tab que indica la posición
                 * final del scroll. Si element existe se ignora el paŕametro step.
                 */
                function scroll(step, element) {
                    var position = null;
                    if (element && element[0]) {
                        position = element.prop('offsetLeft') - 0.5*tabsElement[0].clientWidth-32+0.5*element[0].clientWidth;
                    } else {
                        position = tabsElement.scrollLeft() + step;
                    }

                    tabsElement.scrollLeftAnimated(
                        position, scrollDuration
                    );
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
                        $scope.scrollToElement(name);
                    }
                    if ($location.hash() === name && state !== 'disabled') {
                        $scope.active = name;
                        $scope.scrollToElement(name);
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