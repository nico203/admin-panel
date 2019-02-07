/**
 * @description Select que obtiene las opciones del servidor. Tiene los mismos parámetros
 *              que un select normal + los parámetros "resource" y "field" más abajo detallados.
 *
 *  Ejemplo de uso:
 *  <ap-select
 *      name="fieldName"
 *      label="Label del select"
 *      ng-model="nombreEntidad.fieldName"
 *      entity="entityName">
 *  </ap-select>
 *
 *  Attrs:
 *      - resource: nombre del crudResource que se usará para obtener la
 *        lista de opciones. La ruta del mismo debe contener un parámetro
 *        llamado "field", por ejemplo: bundleName/choices/:field. El valor
 *        de este atributo por defecto es "Choices".
 *      - field: Parámetro que se usará en la consulta para obtener las
 *        opciones. Si este atributo no existe se usa el valor del atributo
 *        "name".
 *      - entity: Parámetro que se usará en la consulta para obtener las
 *        opciones. El valor por defecto se determina del atributo ng-model.
 *      - ngModel: Modelo que modificará la directiva.
 *      - allowEmpty: Agrega un string vacio como opción en el select. Nota:
 *        si el campo en la BD acepta un string vacio agregar la opción en el
 *        backend, usar este atributo en los casos que no se requiera guardar
 *        el dato, por ejemplo para filtrar una tabla.
 *      - label: Label de input
 */
angular.module('adminPanel').directive('apSelect',[
    '$injector', '$timeout', '$document', '$q', 'apSelectProvider',
    function($injector, $timeout, $document, $q, apSelectProvider) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                resource: '@',
                field: '@',
                entity: '@',
                ngModel: '=',
                label: '@'
            },
            link: function(scope, element, attrs, ngModelCtrl) {
                element.addClass('ap-select');

                //Constantes
                var ENTER_KEY_CODE = 13;

                //Inicializar variables
                var field = scope.field ? scope.field : attrs.name;
                var resource = scope.resource ? scope.resource : 'Choices';
                var entity = scope.entity ? scope.entity : null;
                var name = angular.isUndefined(attrs.name) ? 'default' : attrs.name;
                var timeoutToggleListPromise = null;
                var preventClickButton = false;
                var inputElement = element.find('input');
                var allowEmpty = angular.isUndefined(attrs.allowEmpty) ? null : true;
                
                //Si no se paso el atributo entity se calcula con el nombre de ng-model
                if (!entity && attrs.ngModel) {
                    entity = getEntityName(attrs.ngModel);
                }

                //Realizar verificaciones y conversiones de parámetros
                if(!resource) {
                    console.error('El recurso esta definido');
                    return;
                }
                if(!field) {
                    console.error('Los atributos name y field no estan definidos, al menos uno debe estarlo.');
                    return;
                }
                if(typeof field !== 'string') {
                    console.error('Atributo field con formato invalido.');
                    return;
                }
                field = field.toLowerCase();
                entity = entity.toLowerCase();

                //Inicializar scope
                scope.label = scope.label ? scope.label : '';
                scope.selectedValue = null;
                scope.loading = true;
                scope.list = {
                    options: [],
                    displayed: false
                };

                //Obtener servicio para realizar consultas al servidor
                if($injector.has(resource)) {
                    var crudResource = $injector.get(resource, 'apSelect');
                    resource = crudResource.$resource;
                }

                /**
                 * Cargar opciones
                 */
                function loadOptions() {
                    var request = apSelectProvider.get(entity, field);
                    if(!request) {
                        request = resource.get({entity: entity, field: field});
                        apSelectProvider.register(entity, field, request);
                    }
                    request.$promise.then(
                        function(responseSuccess) {
                            if (typeof responseSuccess.data !== 'object') {
                                console.error('Los datos recibidos no son validos.');
                                return;
                            }
                            scope.list.options = angular.copy(responseSuccess.data);

                            if (allowEmpty && scope.list.options[0] !== '') {
                                scope.list.options.unshift('');
                            }
                            changeSelectedValue(scope.list.options[0], true);
                            return responseSuccess.data;
                        },
                        function(responseError) {
                            console.error('Error ' + responseError.status + ': ' + responseError.statusText);
                            apSelectProvider.remove(entity, field);
                            $q.reject(responseError);
                        }
                    ).finally(function() {
                        if(request.$resolved) {
                            scope.loading = false;
                        }
                    });
                }

                /**
                 * Retorna el estado de la lista:
                 *  - true  -> abierta
                 *  - false -> cerrada
                 */
                function listDisplayed() {
                    return scope.list.displayed;
                }

                /**
                 * Cerrar lista
                 */
                function closeList() {
                    if(timeoutToggleListPromise) {
                        return;
                    }
                    if(listDisplayed()) {
                        timeoutToggleListPromise = $timeout( function() {
                            scope.list.displayed = false;
                        }).finally(function() {
                            timeoutToggleListPromise = null;
                        });
                    }
                }

                /**
                 * Abrir lista
                 */
                function openList() {
                    if(timeoutToggleListPromise) {
                        return;
                    }
                    if(!listDisplayed()) {
                        timeoutToggleListPromise = $timeout( function() {
                            scope.list.displayed = true;
                        }).finally(function() {
                            timeoutToggleListPromise = null;
                        });
                    }
                }

                /**
                 * Buscar y retornar primer coincidencia del valor del input en la lista
                 */
                function searchFirstMatch() {
                    var inputValue = inputElement.val();
                    return scope.list.options.find(function (item) {
                        return item.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
                    });
                }

                /**
                 * Cambiar valor seleccionado.
                 */
                function changeSelectedValue(newValue, externalChange) {
                    if (externalChange && angular.isDefined(scope.ngModel) && scope.ngModel !== null) {
                        scope.selectedValue = ngModelCtrl.$modelValue;
                    } else if (angular.isDefined(newValue) && newValue !== null) {
                        scope.selectedValue = newValue;
                        if (externalChange) {
                            scope.ngModel = newValue;
                        } else {
                            ngModelCtrl.$setViewValue(newValue);
                        }
                    } else {
                        scope.selectedValue = ngModelCtrl.$modelValue;
                    }
                }

                /**
                 * Hacer foco en el input
                 */
                function focusInput() {
                    inputElement.focus();
                }

                /**
                 * Quitar foco del input
                 */
                function blurInput() {
                    inputElement.blur();
                }

                /**
                 * Obtener nombre de la entidad (parámetro para hacer el request) dado
                 * el valor de ng-model
                 */
                function getEntityName(ngModel) {
                    if (typeof ngModel !== 'string') {
                        return '';
                    }
                    var entity = ngModel.split(".");
                    var length = entity.length;
                    if (length === 0) {
                        return '';
                    }
                    if (length === 1) {
                        return entity[0];
                    }
                    return entity[length-2];
                }

                /**
                 * Evento disparado al cambiar el valor del input
                 */
                scope.onChangeInput = function() {
                    openList();
                };

                /**
                 * Evento disparado al hacer foco en el input
                 */
                scope.onFocusInput = function () {
                    openList();
                };

                /**
                 * Evento disparado cuando el input pierde el foco
                 */
                scope.onBlurInput = function() {
                    closeList();
                    changeSelectedValue(searchFirstMatch());
                };

                /**
                 * Evento disparado al presionar el botón
                 */
                scope.onClickButton = function() {
                    if(!preventClickButton) {
                        focusInput();
                    }
                };

                /**
                 * Evento disparado al presionar el botón
                 */
                scope.onMousedownButton = function(e) {
                    preventClickButton = listDisplayed();
                };

                /**
                 * Evento disparado al seleccionar un elemento de la lista
                 */
                scope.onClickItemList = function(e, item) {
                    e.stopPropagation();
                    changeSelectedValue(item);
                };

                /**
                 * Evento disparado al presionar enter
                 */
                function enterHandler(event) {
                    if (listDisplayed() && event.keyCode === ENTER_KEY_CODE) {
                        blurInput();
                        event.preventDefault();
                    }
                }

                /**
                 * Evento disparado al destruir la directiva
                 */
                scope.$on('$destroy', function() {
                    $document.off('keydown', enterHandler);
                });

                $document.on('keydown', enterHandler);

                /**
                 * Evento disparado cuando cambia el valor del modelo y la vista necesita actualizarse.
                 */
                ngModelCtrl.$render = function() {
                    loadOptions();
                };
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);