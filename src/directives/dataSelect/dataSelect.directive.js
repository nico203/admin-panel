
/**
 * KNOWN ISSUES
 *  - Si la lista esta cerrada, y el foco lo posee el input de la lista al cambiar de ventana en el SO y volver a la
 *  ventana actual, el navegador le da el foco al input, que al estar la lista cerrada la despliega. Esto no deberia pasar
 *  y la lista deberia permanecer cerrada.
 *
 *  sugerencias
 *  - La cantidad maxima de items a mostrar debe estar definida en el archivo de configuracion de la app. Para eso
 *  se deberia definir una propiedad dentro del servicio CrudConfig
 *
 *  Consideraciones generales
 *
 *  En un evento, para cancelarlo en un hijo, el evento debe ser el mismo. En este caso se usa mousedown para todo.
 *
 *  //doc
 *
 *  resource: nombre del CrudResource especificado
 *  queryParams: propiedades que se usan como parametros de la consulta para filtrar resultados, si no están definidos se usan las
 *               propiedades definidas en el objeto properties
 *  method: es el metodo del CrudResource que se establece para realizar la consulta. Por defecto 'get'
 *  properties: son las propiedades de las entidades a mostrar como opcion en la lista desplegable, concatenadas por una coma (,)
 *  filters: filtros aplicados a las propiedades. Ejemplo: filters="['date::dd/MM/yyyy', 'uppercase', '', 'lowercase']".
 *           para especificar el formato de un filtro utilizar "::".
 *  details: atributos que serán mostrados como detalle, usado cuando se quiere mostrar más datos que los proporcionados por la lista.
 *           formato: [label1: atribute1 | filter1 | filter2, label2: atribute2 | filter3 | filter1]
 *           ejemplo: ["Dirección:domicilio", "Fecha de Nacimiento:fechaNacimiento | date: 'dd / MM / yyyy'"]
 *  disable: Permite deshabilitar el input.
 *  itemsLimit: Define el límite de elementos a mostrar. Si el valor negativo no se añade límite.
 */
angular.module('adminPanel').directive('apDataSelect', [
    '$timeout', '$rootScope', '$q', '$injector', '$document', '$filter',
    function ($timeout, $rootScope, $q, $injector, $document, $filter) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                resource: '@',
                queryParams: '=?',
                method: '@?',
                requestParam: '=?',
                properties: '=',
                filters: '=?',
                details: '<?',
                disabled: '<',
                itemsLimit: '<',
                label: '@'
            },
            link: function (scope, elem, attr, ngModel) {
                elem.addClass('data-select');

                var resource = null;
                //obtenemos el servicio para hacer las consultas con el servidor}
                if($injector.has(scope.resource)) {
                    var crudResource = $injector.get(scope.resource, 'apSelect');
                    resource = crudResource.$resource;
                }
                if(!resource) {
                    console.error('El recurso no esta definido');
                }

                //se define el límite de items a mostrar. El valor por defecto es 6.
                scope.itemsLimit = scope.itemsLimit ? scope.itemsLimit : 6;

                //habilitamos el boton para agregar entidades
                scope.enableNewButton = !(angular.isUndefined(attr.new) || attr.new === null || attr.new === '');

                //inicializar valor de label
                scope.label = scope.label ? scope.label : '';

                //obtenemos el nombre del select dado el atributo name
                var name = angular.isUndefined(attr.name) ? 'default' : attr.name;

                //se definen las propiedades del objeto a mostrar.
                var objectProperties = angular.isString(scope.properies) ? scope.properties.split(',') : scope.properties;

                //se generan los datos necesarios para aplicar los filtros
                var filtersData = [];
                var propertyFilters = angular.isString(scope.filters) ? scope.filters.split(',') : scope.filters;
                objectProperties.forEach(function(filter, i) {
                    if (angular.isDefined(propertyFilters) && propertyFilters[i]) {
                        filtersData.push(propertyFilters[i].split('::'));
                    } else {
                        filtersData.push(['','']);
                    }
                });


                //se generan los datos para mostrar los detalles del item que se está observando
                scope.itemDetailsData = null;
                if (angular.isArray(scope.details) && scope.details.length > 0) {
                    scope.itemDetailsData = [];
                    var aux, filters, i = null;
                    scope.details.forEach(function(itemData) {
                        if (!angular.isString(itemData)) {
                            console.error("Formato incorrecto de parámetro details");
                            return;
                        }
                        i = itemData.indexOf('|');
                        if (i >= 0) {
                            aux = [itemData.slice(0,i), itemData.slice(i+1)];
                            itemData = aux[0];
                            filters = aux[1];
                        } else {
                            filters = null;
                        }
                        itemData = itemData.split(':');
                        if (itemData.length !== 2) {
                            console.error("Formato incorrecto de parámetro details");
                            return;
                        }
                        itemData[2] = filters ? ( '|' + filters) : '';
                        scope.itemDetailsData.push(itemData);
                    });
                }

                //elemento seleccionado
                scope.itemSelected = null;

                //inicializamos los componentes
                scope.input = {
                    model: null,
                    vacio: true
                };
                scope.lista = {
                    items: [],
                    desplegado: false
                };

                //Indica el estado del request.
                scope.loading = false;
                var timeoutCloseListPromise = null;
                var timeoutOpenListPromise = null;

                var defaultMethod = (angular.isUndefined(scope.method) || scope.method === null) ? 'get' : scope.method;
                var queryParams = angular.isString(scope.queryParams) ? scope.queryParams.split(',') : scope.queryParams || objectProperties;

                var request = null;
                var preventClickButton = false;

                /**
                 * Funcion que convierte un objeto a un item de la lista segun las propiedades especificadas
                 * en la propiedad properties de la directiva
                 *
                 * @param {Object} object
                 * @returns {Object}
                 */
                function convertObjectToItemList(object) {
                    var name = '';
                    //Seteamos solamente los campos seleccionados a mostrar
                    for(var j = 0; j < objectProperties.length; j++) {
                        if (!object[objectProperties[j]]) {
                            name +=' - , ';
                        } else if (filtersData[j][0] && filtersData[j][1]) {
                            name += $filter(filtersData[j][0])(object[objectProperties[j]], filtersData[j][1]) + ', ';
                        } else if (filtersData[j][0]) {
                            name += $filter(filtersData[j][0])(object[objectProperties[j]]) + ', ';
                        } else {
                            name += object[objectProperties[j]] + ', ';
                        }
                    }
                    //borramos la ultima coma
                    name = name.replace(/,\s*$/, "");

                    return {
                        name: name,
                        $$object: angular.copy(object)
                    };
                }

                /**
                 * Se realiza el request. En caso de haber uno en proceso se lo cancela
                 * Emite un evento en donde se manda la promise.
                 *
                 * El parametro all establece que se haga una consulta sin parametros.
                 * Esta se hace cuando se inicializa el componente y todavia no se hizo ningun request
                 *
                 * @param {boolean} all Establece si se usan los filtros para filtrar las entidades
                 */
                function doRequest(all) {
                    if(request) {
                        request.$cancelRequest();
                    }

                    var search = {};

                    if(!angular.isUndefined(scope.requestParam) && angular.isNumber(scope.requestParam)) {
                        search.id = scope.requestParam;
                    }

                    if(!all) {
                        for (var j = 0; j < queryParams.length; j++) {
                            search[queryParams[j]] = scope.input.model;
                        }
                    }


                    request = resource[defaultMethod](search);

                    //seteamos en la vista que el request esta en proceso
                    scope.loading = true;
                    var promise = request.$promise.then(function(rSuccess) {
                        var max = (rSuccess.data && scope.itemsLimit >=0 && rSuccess.data.length > scope.itemsLimit) ? scope.itemsLimit : rSuccess.data.length;
                        //creamos la lista. Cada item es de la forma
                        //{name:'name',id:'id'}
                        var list = [];
                        for(var i = 0; i < max; i++) {
                            var object = rSuccess.data[i];
                            list.push(convertObjectToItemList(object));
                        }
                        scope.lista.items = list;

                        if(!scope.lista.desplegado) {
                            scope.lista.desplegado = true;
                        }

                        return rSuccess.data;
                    }, function(rError) {
                        $q.reject(rError);
                    });

                    //steamos en la vista que el request se termino de procesar
                    promise.finally(function() {
                        if(request.$resolved) {
                            scope.loading = false;
                        }
                    });
                    scope.$emit('ap-select:request', name, promise);
                }


                /**
                 * Por ahora la lista solo se cierra en el evento blur del input
                 */
                function closeList() {
                    //dado el caso de que el comportamiento de $timeout.cancel() no esta rechazando las promesas
                    // (posible bug de angular) se verifica que el timeoutCloseListPromise sea distinto de null
                    // es decir, la promesa no haya sido cancelada
                    if(timeoutCloseListPromise === null) return;

                    //cerramos la lista
                    scope.lista.desplegado = false;

                    //si hay un request en proceso se lo cancela
                    if(request) {
                        request.$cancelRequest();
                    }

                    //seteamos el modelo si no hubo cambios
                    scope.input.model = (scope.itemSelected === null) ? '' : scope.itemSelected.name;
                    scope.input.vacio = (scope.itemSelected === null);
                }

                /**
                 * Por ahora la lista se abre solo en el foco al input
                 */
                function openList() {
                    //en caso de haber una promesa activa para cerrar la lista no se la vuelve a abrir
                    if(timeoutCloseListPromise !== null) {
                        return;
                    }

                    //se abre la lista
                    scope.lista.desplegado = true;
                    //si la lista interna esta vacia se hace el request sin parametros en la consulta
                    if (scope.lista.items.length === 0) {
                        doRequest(true);
                    }
                }

                //eventos relacionados con el input

                /**
                 * Cambiar valor seleccionado.
                 */
                function changeSelectedValue(val) {
                    ngModel.$setViewValue(val);
                    if (val) {
                        //seteamos el item actual
                        scope.itemSelected = convertObjectToItemList(val);

                        //seteamos el estado actual del modelo
                        scope.input.model = (scope.itemSelected === null) ? '' : scope.itemSelected.name;
                        scope.input.vacio = (scope.itemSelected === null);
                    }
                }

                /**
                 * Si la lista no esta desplegada se la despliega. En todos los casos se hace el request
                 */
                scope.onChangeInput = function() {
                    if(!scope.lista.desplegado) {
                        scope.lista.desplegado = true;
                    }

                    //chequeamos si el input esta vacio
                    scope.input.vacio = (angular.isUndefined(scope.input.model) && scope.input.model.length !== 0);
                    doRequest();
                };

                /**
                 * Si el valor referenciado por ng-model cambia programáticamente y $modelValue y $viewValue
                 * son diferentes, el valor del modelo vuelve a ser null.
                 */
                ngModel.$render = function() {
                    scope.input = {
                        model: null,
                        vacio: true
                    };
                };

                /**
                 * Se despliega la lista si no esta desplegada.
                 * Solo se hace el request si la lista interna esta vacia
                 */
                scope.onFocusInput = function () {

                    if(!scope.lista.desplegado) {
                        timeoutOpenListPromise = $timeout(openList).finally(function() {
                            timeoutOpenListPromise = null;
                        });
                    }
                };

                /**
                 * Se usa el $timeout que retorna una promesa. Si el click proximo viene dado por un evento dentro
                 * del select se cancela la promesa. Caso contrario, se ejecuta este codigo
                 */
                scope.onBlurInput = function() {
                    if(timeoutOpenListPromise !== null) {
                        $timeout.cancel(timeoutOpenListPromise);
                        timeoutOpenListPromise = null;
                    }


                    timeoutCloseListPromise = $timeout(closeList, 100).finally(function() {
                        timeoutCloseListPromise = null;
                    });
                };

                //eventos relacionados con el boton
                /**
                 * Hace un toggle de la lista, es decir si esta desplegada, la cierra y sino la abre
                 * En caso de que la lista este desplegada no se hace nada, ya que el evento blur del input cierra la lista
                 * Si no está desplegada, la despliega, viendo de hacer o no el request, segun la lista interna tenga
                 * tenga o no elementos.
                 */
                scope.onClickButton = function() {

                    //si no se previene el evento, se despliega la lista
                    if(!preventClickButton) {
                        if(timeoutCloseListPromise !== null) {
                            $timeout.cancel(timeoutCloseListPromise);
                            timeoutCloseListPromise = null;
                        }

                        //le damos el foco al input
                        elem.find('input').focus();
                    }
                };

                /**
                 * Toma el evento antes del click, dado que el click se computa cuando el usuario suelta el raton
                 * Si la lista no esta desplegada, el curso es el de no prevenir el evento click, para que la lista
                 * se despliegue.
                 * Si la lista esta desplegada, el curso es el de prevenir el evento click, para que cuando el input
                 * pierda el foco, la lista se cierre, pero cuando el usuario suelte el raton no se dispare el evento
                 * click, lo que volvería a abrir la lista, lo cual NO es deseado.
                 */
                scope.onMousedownButton = function(e) {
                    preventClickButton = scope.lista.desplegado;
                };

                //eventos relacionados con la lista

                /**
                 * Al seleccionar un item de la lista se guarda en el modelo y la lista pasa a estado no desplegado
                 * El menu se cierra dado el timeout del evento blur, que se dispara al hacer click sobre un item de la lista
                 */
                scope.onClickItemList = function(e, item) {
                    e.stopPropagation();

                    //seteamos el item actual
                    scope.itemSelected = item;

                    //asignamos el id de la entidad al modelo
                    ngModel.$setViewValue(item.$$object);

                    //emitimos un evento al seleccionar un item, con el item y el nombre del elemento que se selecciono
                    scope.$emit('ap-select:item-selected', name, item);
                };

                /**
                 * Al hacer click en la lista se cancela el evento para no cerrar la lista
                 */
                function onListClick() {
                    if(timeoutCloseListPromise !== null) {
                        $timeout.cancel(timeoutCloseListPromise);
                        timeoutCloseListPromise = null;
                    }
                }

                /**
                 * Evento usado para mostrar detalles de items
                 */
                scope.onOverItemList = function (e, item) {
                    scope.itemOver = item.$$object;
                };

                /**
                 * Se ejecuta cuando el usuario da click al boton nuevo.
                 * Lanza el evento para mostrar el box correspondiente
                 */
                scope.newObject = function (e) {
                    e.stopPropagation();

                    $rootScope.$broadcast('apBox:show', {
                        source: attr.name,
                        destination: attr.new
                    });
                };

                //Eventos relacionados con entradas del teclado

                function enterHandler(event) {
                    var ENTER_KEY_CODE = 13;
                    if (scope.lista.desplegado && event.keyCode === ENTER_KEY_CODE) {
                        elem.find('input').blur();
                        event.preventDefault();
                    }
                }

                //registramos los eventos
                
                scope.$on('select:loadSelectedData', function(e, data) {
                    if (attr.name === data.destination && data.data) {
                        changeSelectedValue(data.data);
                    }
                });
                elem.on('mousedown', '.dropdown-ap', onListClick);
                $document.on('keydown', enterHandler);

                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, changeSelectedValue);

                /**
                 * Liberamos los eventos que hayan sido agregados a los elementos
                 */
                var destroyEventOnDestroy = scope.$on('$destroy', function() {
                    elem.off('mousedown', '.dropdown-ap', onListClick);
                    $document.off('keydown', enterHandler);
                    destroyEventOnDestroy();
                });
            },
            templateUrl: 'directives/dataSelect/dataSelect.template.html'
        };
    }
]);
