angular.module('adminPanel').directive('apTextarea', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                maxlength: '@',
                helpInfo: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                var DEFAULT_MAX_LENGTH = 6000;

                scope.label = scope.label ? scope.label : '';
                scope.maxlength = scope.maxlength ? scope.maxlength : DEFAULT_MAX_LENGTH;
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;
                scope.modalId = attr.name + 'Modal';

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/textarea/textarea.template.html'
        };
    }
]);
