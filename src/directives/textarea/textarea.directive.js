angular.module('adminPanel').directive('apTextarea', [
    '$timeout',
    function($timeout) {
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
                    scope.textAreaAdjust();
                };

                scope.textAreaAdjust = function() {
                    $timeout(function() {
                        elem.find("textarea")[0].style.height = "1px";
                        elem.find("textarea")[0].style.height = (5+elem.find("textarea")[0].scrollHeight)+"px";
                    });
                };

                ngModelCtrl.$render = function() {
                    scope.textAreaAdjust();
                };
            },
            templateUrl: 'directives/textarea/textarea.template.html'
        };
    }
]);
