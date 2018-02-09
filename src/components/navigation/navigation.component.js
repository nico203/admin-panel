function navigationController($scope, $timeout, AdminPanelConfig) {
    $scope.items = AdminPanelConfig.navigationItems;
    $scope.elem = $('navigation');
    $scope.activeRole = null;

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

    this.$onInit = function() {
        //En este caso $timeout es usado para ejecutar una funcion despues de que termine el ciclo $digest actual
        //cuando se termino de linkear todos los elementos de ngRepeat
        //https://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished
        $timeout(function() {
            $scope.elem = $('navigation');
            $scope.accordion = new Foundation.AccordionMenu($scope.elem);
            $scope.elem.find('> .menu').addClass('visible');
        });
    };

    this.$onDestroy = function() {
        if($scope.accordion) {
            $scope.accordion.$element.foundation('_destroy');
        }
    };
}

angular.module('adminPanel.navigation', [
    'adminPanel'
]).component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', navigationController]
});