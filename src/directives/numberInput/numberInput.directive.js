angular.module('adminPanel').directive('apNumberInput', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                max: '@',
                min: '@',
                step: '@',
                previousLabel: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                scope.label = scope.label ? scope.label : '';
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;
                scope.previousLabel = scope.previousLabel ? scope.previousLabel : null;

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/numberInput/numberInput.template.html'
        };
    }
]);
