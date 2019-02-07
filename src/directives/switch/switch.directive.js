angular.module('adminPanel').directive('apSwitch', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                name: '@',
                label: '@',
                ngModel: '='
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/switch/switch.template.html'
        };
    }
]);
