/**
 * Directiva que maneja el control de las clases de error en un campo de un formulario. 
 * Usa las clases de foundation para el estado de error de un campo.
 * http://foundation.zurb.com/sites/docs/abide.html
 * 
 * Tambien setea los mensajes a mostrar en la aplicacion. Si no se setea ninguno se toman los mensajes por defecto.
 * Toma los errores del input que tiene definido como elemento hijo.
 * Los mensajes deben ser definidos como un objeto en donde la clave es el nombre del error y el valor es el mensaje
 * var obj = {
 *   error: 'msg'
 * }
 */
angular.module('adminPanel').directive('formFieldError', [
    '$animate','$compile','AdminPanelConfig',
    function($animate,$compile,AdminPanelConfig) {
        return {
            require: '^form',
            restrict: 'A',
            scope: {
                messages: '=?',
                expr: '='
            },
            link: function(scope, elem, attr, ctrl) {
                scope.inputElem = elem.find('input');
                scope.inputErrors = ctrl[scope.inputElem.attr('name')].$error;
                scope.errors = {};
                for(var key in scope.messages) {
                    scope.errors[key] = {
                        expresion: false,
                        message: scope.messages[key]
                    };
                }
                scope.fieldErrorMsgDirective = angular.element('<field-error-messages>');
                scope.fieldErrorMsgDirective.attr('errors', 'errors');
                elem.append(scope.fieldErrorMsgDirective);
                $compile(scope.fieldErrorMsgDirective)(scope);
                
                //Evaluamos los errores del campo hijo segun su nombre
                //Ver propiedad $error en https://docs.angularjs.org/api/ng/type/form.FormController
                scope.$watch('inputErrors', function(val) {
                    for(var key in val) {
                        if(!scope.errors[key]) {
                            scope.errors[key] = {
                                expresion: false,
                                message: (scope.messages) ? scope.messages[key] : AdminPanelConfig.defaultFormMessages[key]
                            };
                        }
                        scope.errors[key].expresion = val[key];
                    }
                });
                
                //Evaluamos la expresion pasada al atributo de la directiva, si es verdadero 
                //seteamos las clases de error al formulario
                scope.$watch('expr', function(val) {
                    $animate[val ? 'addClass' : 'removeClass'](elem, 'is-invalid-label');
                    $animate[val ? 'addClass' : 'removeClass'](scope.inputElem, 'is-invalid-input');
                    $animate[val ? 'addClass' : 'removeClass'](scope.fieldErrorMsgDirective, 'is-visible');
                });
            }
        };
    }
]);
