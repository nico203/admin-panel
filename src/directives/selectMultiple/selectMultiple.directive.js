/**
 * @description Select que permite seleccionar multiples valores y que obtiene las opciones del servidor.
 *              Tiene los mismos parámetros que un select normal + los parámetros "resource" y "field" más abajo detallados.
 *
 *  Ejemplo de uso:
 *  <label>Label del select</label>
 *
 *  <ap-select-multiple
 *      name="fieldName"
 *      ng-model="nombreEntidad.fieldName"
 *      entity="entityName">
 *  </ap-select-multiple>
 *
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
 */
angular.module('adminPanel').directive('apSelectMultiple',[
    '$injector', '$timeout', '$document', '$q', 'apSelectMultipleProvider',
    function($injector, $timeout, $document, $q, apSelectMultipleProvider) {
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
                element.addClass('select-multiple');

                var ENTER_KEY_CODE = 13;

                //Inicializar variables

                var field = scope.field ? scope.field : attrs.name;
                var resource = scope.resource ? scope.resource : 'Choices';
                var entity = scope.entity ? scope.entity : null;
                var name = angular.isUndefined(attrs.name) ? 'default' : attrs.name;
                var timeoutToggleListPromise = null;
                var preventClickButton = false;
                var inputElement = element.find('input');

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
                scope.selectedValues = [];
                scope.loading = true;
                scope.list = {
                    options: [],
                    displayed: false
                };
                scope.searchValue = '';

                //Obtener servicio para realizar consultas al servidor
                if($injector.has(resource)) {
                    var crudResource = $injector.get(resource, 'apSelect');
                    resource = crudResource.$resource;
                }

                /**
                 * Cargar opciones
                 */
                function loadOptions() {
                    var request = apSelectMultipleProvider.get(entity, field);
                    if(!request) {
                        request = resource.get({entity: entity, field: field});
                        apSelectMultipleProvider.register(entity, field, request);
                    }
                    request.$promise.then(
                        function(responseSuccess) {
                            var data = responseSuccess.data;
                            if (typeof data !== 'object') {
                                console.error('Los datos recibidos no son validos.');
                                return;
                            }
                            scope.list.options = data;
                            if (angular.isDefined(scope.ngModel) && scope.ngModel !== null) {
                                //Si existe un valor en el modelo se coloca ese valor
                                scope.selectedValues = scope.ngModel;
                            }
                            return data;
                        },
                        function(responseError) {
                            console.error('Error ' + responseError.status + ': ' + responseError.statusText);
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
                    scope.searchValue = '';
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
                 * Agregar un elemento a la lista de valores seleccionados
                 */
                function addSelectedValue(value) {
                    if (angular.isDefined(value) && value !== null) {
                        if (!isSelected(value)) {
                            scope.selectedValues.push(value);
                            ngModelCtrl.$setViewValue(scope.selectedValues);
                        }
                    } else {
                        //Si el valor recibido no está definido se usa el valor del modelo
                        scope.selectedValues = ngModelCtrl.$modelValue;
                    }
                }

                /**
                 * Quitar un elemento de la lista de valores seleccionados
                 */
                function removeSelectedValue(value) {
                    if (angular.isDefined(value) && value !== null) {
                        scope.selectedValues.splice(scope.selectedValues.indexOf(value), 1);
                        ngModelCtrl.$setViewValue(scope.selectedValues);
                    } else {
                        //Si el valor recibido no está definido se usa el valor del modelo
                        scope.selectedValues = ngModelCtrl.$modelValue;
                    }
                }

                /**
                 * Comprobar si un elemento se encuentra en la lista de elementos seleccionados
                 */
                function isSelected(value) {
                    return (scope.selectedValues.indexOf(value) >= 0);
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

                //Eventos relacionados con el input

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
                };

                //Eventos relacionados con los botones

                /**
                 * Evento disparado al presionar el botón agregar
                 */
                scope.onClickAddButton = function() {
                    if(!preventClickButton) {
                        focusInput();
                    }
                };

                /**
                 * Evento disparado al presionar el botón quitar
                 */
                scope.onClickRemoveButton = function(value) {
                    removeSelectedValue(value);
                };

                /**
                 * Evento disparado al presionar el botón
                 */
                scope.onMousedownButton = function(e) {
                    preventClickButton = listDisplayed();
                };

                //Eventos relacionados con la lista

                /**
                 * Evento disparado al seleccionar un elemento de la lista
                 */
                scope.onClickItemList = function(e, item) {
                    e.stopPropagation();
                    addSelectedValue(item);
                };

                //Eventos relacionados con entradas del teclado

                function enterHandler(event) {
                    if (listDisplayed() && event.keyCode === ENTER_KEY_CODE) {
                        blurInput();
                        event.preventDefault();
                    }
                }

                //Eventos relacionados con la directiva

                /**
                 * Evento disparado al destruir la directiva
                 */
                scope.$on('$destroy', function() {
                    $document.off('keydown', enterHandler);
                });

                //Eventos relacionados con el modelo

                /**
                 * Evento disparado cuando cambia el valor del modelo y la vista necesita actualizarse. Esta función
                 * epermite que los valores mencionados queden sincronizados.
                 */
                ngModelCtrl.$render = function() {
                    if (angular.isUndefined(scope.ngModel) || scope.ngModel.length === 0 && scope.selectedValues.length > 0) {
                        //Si el valor del modelo se pierde pero existen valores seleccionados se utilizan los valores seleccionados
                        scope.ngModel = scope.selectedValues;
                    }
                    if (angular.isDefined(scope.ngModel) && angular.isArray(scope.ngModel) && scope.ngModel.length > 0) {
                        //Si el modelo cambia se usan los valores del modelo
                        scope.selectedValues = scope.ngModel;
                    }
                };

                // Asociar eventos y ejecutar funciones de inicialización

                $document.on('keydown', enterHandler);
                loadOptions();
            },
            templateUrl: 'directives/selectMultiple/selectMultiple.template.html'
        };
    }
]);