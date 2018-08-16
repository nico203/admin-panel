angular.module('adminPanel').directive('formValidation', [
    '$parse','$compile',
    function($parse,$compile) {
        return {
            require: 'form',
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr, formCtrl) {
                //Definimos las validaciones
                var required = function(fieldCtrl, expression) {
                    if(angular.isUndefined(expression)) {
                        expression = true;
                    }
                    return function(modelValue, viewValue) {
                        return !expression || !fieldCtrl.$isEmpty(viewValue);
                    };
                };
                var number = function(ctrl) {
                    
                };
                
                var validators = {
                    required: required
                };
                
                
                //Seteamos las validaciones
                var validations = $parse(attr.formValidation)(scope);
                scope.validations = {};
                for(var field in validations) {
                    var fieldCtrl = formCtrl[field];
                    var fieldDOMElem = fieldCtrl.$$element;
                    var messages = {};
                    for(var validation in validations[field]) {
                        var validator = validations[field][validation];
                        fieldCtrl.$validators[validation] = validators[validation](fieldCtrl, validator.expression);
                        messages[validation] = validator.message;
                    }
                    scope.validations[field] = {
                        errors: fieldCtrl.$error,
                        messages: messages
                    };
                    var fieldErrorMessagesDirective = angular.element('<field-error-messages errors="validations.'+field+'.errors" messages="validations.'+field+'.messages">');
                    $compile(fieldErrorMessagesDirective)(scope);
                    fieldDOMElem.after(fieldErrorMessagesDirective);
                }
            }
        };
    }
]);