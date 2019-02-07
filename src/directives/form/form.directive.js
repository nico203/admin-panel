/**
 * @description Directiva que reemplaza a <form>. Cuenta con las siguientes funcionaldiades:
 *  - Llamar a angular-validator para que se verifique si el formulario contiene errores.
 *  - Mostrar un mensaje en caso de que el formulario no sea correcto.
 *  - Realizar un scroll hasta el mensaje mencionado previamente una vez presionado el botón de submit.
 *  - Agregar el botón de submit.
 *  - Agregar el botón de cancel si existe $scope.cancel.
 *  - Cambiar el nombre del botón del submit con el valor de $scope.submitButtonValue
 * 
 *  Attrs:
 *      - id: El id de <form>
 */
angular.module('adminPanel').directive('apForm',[
    '$document', '$timeout',
    function($document, $timeout) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: false,
            link: function($scope, element, attr, ctrl, transclude) {
                $scope.formId = attr.id;
                $scope.errorData = {};
                $scope.submitButtonValue = $scope.submitButtonValue ? $scope.submitButtonValue : 'Guardar';
                
                var contentElement = $(element).children().eq(1);

                //Se define la función transclude para que el contenido utilice el mismo scope
                transclude($scope, function(clone, $scope) {
                    contentElement.append(clone);
                });

                $scope.$watch('errorDetails', function() {
                    if ($scope.errorDetails) {
                        transformErrorData($scope.errorDetails, $scope.errorData);
                    } else {
                        $scope.errorData = {};
                    }
                });

                $scope.scroll = function(formId) {
                    if ($document.scrollToElement) {
                        var element = angular.element(document.getElementById(formId));
                        if (element) {
                            $timeout( function () {
                                $document.scrollToElement(
                                    element,
                                    110,
                                    500
                                );
                            });
                        }
                    }
                };

                /**
                 * @description Función que crea un objeto con los mensajes de error a partir de la respuesta de symfony
                 *
                 * @param {Object} dataObj Objeto data de la respuesta de symfony
                 * @param {type} newData Objeto donde se guarda el arreglo de errores
                 * @returns {undefined}
                 */
                function transformErrorData(dataObj, newData) {
                    newData.errors = [];
                    if (dataObj && dataObj.code === 400 || dataObj.code === 404) {
                        if (dataObj.errors) {
                            iterateErrorObject(dataObj.errors, newData);
                        } else {
                            newData.errors.push(dataObj.message);
                        }
                    }

                    function iterateErrorObject(obj, data) {
                        for (var property in obj) {
                            if (obj.hasOwnProperty(property)) {
                                if (angular.isArray(obj[property]) && property === 'errors') {
                                    data.errors = data.errors.concat(obj[property]);
                                } else if (angular.isObject(obj[property])) {
                                    iterateErrorObject(obj[property], data);
                                }
                            }
                        }
                    }
                }
            },
            templateUrl: 'directives/form/form.template.html'
        };
    }
]);