angular.module('adminPanel').directive('apTextInput', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                maxlength: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                var DEFAULT_MAX_LENGTH = 300;

                scope.label = scope.label ? scope.label : '';
                scope.maxlength = scope.maxlength ? scope.maxlength : DEFAULT_MAX_LENGTH;
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/textInput/textInput.template.html'
        };
    }
]);
