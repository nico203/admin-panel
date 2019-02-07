angular.module('adminPanel.navigation', [
    'adminPanel'
]).

component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', '$location',
        function ($scope, $timeout, AdminPanelConfig, $location) {
            $scope.items = {};
            $scope.elem = $('navigation');
            $scope.activeRole = null;
            $scope.currentRoute = null;
            $scope.baseIndex = null;
        
            /**
             * @description Indica si un item de la lista debe mostrarse o no
             * 
             * @param {object} item Item de la lista
             * @returns {boolean}
             */
            function showItem(item) {
                if (!item.roles || !$scope.activeRole) {
                    return true;
                }
                if (angular.isArray(item.roles)) {
                    return item.roles.some(function(role) {
                        return isActiveRole(role);
                    });
                }
                return isActiveRole(item.roles);
            }
        
            /**
             * @description Indica si un determinado rol de usuario se ecnuentra activo o no
             * 
             * @param {(string|Array)} role Rol o roles de usuario
             * @returns {boolean}
             */
            function isActiveRole(role) {
                if (angular.isArray($scope.activeRole)) {
                    return $scope.activeRole.includes(role);
                }
                return role === $scope.activeRole;
            }
        
            /**
             * @description Incializar accordion de Foundation
             */
            function initializeAccordion() {
                $timeout(function() {
                    $scope.accordion = new Foundation.AccordionMenu($scope.elem);
                    $scope.elem.find('> .menu').addClass('visible');

                    var nestedItemActive = $scope.elem.find('> .menu .nested li.is-active a');
                    if (nestedItemActive && nestedItemActive.length > 0) {
                        nestedItemActive = nestedItemActive.parent().parent();
                        $scope.accordion.$element.foundation('down', nestedItemActive);
                    }
                });
            }


            /**
             * @description Destruir accordion
             */
            function destroyAccordion() {
                if($scope.accordion) {
                    $scope.accordion.$element.foundation('_destroy');
                }
            }

            /**
             * @description Genera los items del menu basándose en $scope.activeRole
             */
            function generateItems() {
                $scope.items = {};
                for(var item in AdminPanelConfig.navigationItems) {
                    if (showItem(AdminPanelConfig.navigationItems[item])) {
                        $scope.items[item] = angular.copy(AdminPanelConfig.navigationItems[item]);
                    }
                }
            }
        
            /**
             * @description Función que se llama cuando se cambia de ruta y cuando se inicializa el accordion.
             * 
             * @param {string} route ruta actual
             */
            function changeRoute(route) {
                $scope.currentRoute = route;
                var index = 0;
                for(var item in $scope.items) {
                    if($scope.items[item].link === '#') {
                        //el elemento tiene items anidados
                        for(var nestedItem in $scope.items[item].items) {
                            var r = $scope.items[item].items[nestedItem].link;
                            if(r.slice(r.indexOf('/')) === route) {
                                $scope.baseIndex = index;
                                break;
                            }
                        }
                    } else {
                        //el elemento no tiene items anidados por lo tanto se checkea la ruta
                        var routeAux = $scope.items[item].link.slice($scope.items[item].link.indexOf('/'));
                        if(routeAux === route) {
                            $scope.baseIndex = index;
                            break;
                        }
                    }
                    index++;
                }
            }

            /**
             * @description Evento que recibe los datos del usuario logueado y modifica el menu según el rol.
             * 
             * @param {object} e Event
             * @param {object} data Datos de usuario. Ej: data: {roles: ['ROLE1', 'ROLE2']}
             */
            $scope.$on('userData', function(e, data) {
                if (data) {
                    if ($scope.activeRole !== data.roles) {
                        $scope.activeRole = data.roles;
                        generateItems();
                        destroyAccordion();
                        initializeAccordion();
                        changeRoute($location.path());
                    }
                } else {
                    $scope.items = {};
                    $scope.activeRole = null;
                    destroyAccordion();
                    initializeAccordion();
                    changeRoute($location.path());
                }
            });
        
            $scope.checkRoute = function(route) {
                var routeAux = route.slice(route.indexOf('/'));
                return {
                    'is-active': routeAux === $scope.currentRoute
                };
            };
        
            this.$onDestroy = function() {
                destroyAccordion();
            };
        
            $scope.$on('$routeChangeSuccess', function(e, route) {
                changeRoute($location.path());
            });
        }
    ]
});