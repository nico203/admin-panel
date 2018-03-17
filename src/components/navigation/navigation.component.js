function navigationController($scope, $timeout, AdminPanelConfig, $location) {
    $scope.items = AdminPanelConfig.navigationItems;
    $scope.elem = $('navigation');
    $scope.activeRole = null;
    $scope.currentRoute = null;
    $scope.baseIndex = null;

    $scope.showItem = function (data) {
        if (!data.roles || !$scope.activeRole) {
            return true;
        }
        if (angular.isArray(data.roles)) {
            return data.roles.some(function (element) {
                return isActiveRole(element);
            });
        }
        return isActiveRole(data.roles);
    };

    function isActiveRole(element) {
        if (angular.isArray($scope.activeRole)) {
            return $scope.activeRole.includes(element);
        }
        return element === $scope.activeRole;
    }

    $scope.$on('userData', function(e, data) {
        if (data) {
            $scope.activeRole = data.roles;
        } else {
            $scope.activeRole = null;
        }
    });

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

    $scope.checkRoute = function(route) {
        var routeAux = route.slice(route.indexOf('/'));
        return {
            'is-active': routeAux === $scope.currentRoute
        };
    };

    this.$onInit = function() {
        //En este caso $timeout es usado para ejecutar una funcion despues de que termine el ciclo $digest actual
        //cuando se termino de linkear todos los elementos de ngRepeat
        //https://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished
        $timeout(function() {
            $scope.elem = $('navigation');
            $scope.accordion = new Foundation.AccordionMenu($scope.elem);
            $scope.elem.find('> .menu').addClass('visible');
        });

        changeRoute($location.path());
    };

    this.$onDestroy = function() {
        if($scope.accordion) {
            $scope.accordion.$element.foundation('_destroy');
        }
    };

    $scope.$on('$routeChangeSuccess', function(e, route) {
        changeRoute($location.path());
    });
}

angular.module('adminPanel.navigation', [
    'adminPanel'
]).component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', '$location', navigationController]
});