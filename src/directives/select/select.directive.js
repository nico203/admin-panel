/**
 * KNOWN ISSUES
 *  - Si la lista esta abierta, al presionar el boton por mucho tiempo (1 segundo), la lista se cierra al perder el 
 *  foco del input cuando se hace el click, y cuando se lo suelta se vuelve a darle el foco al input, provocando que
 *  se abra de nuevo la lista. El comportamiento esperado es que la lista permanezca cerrada.
 *  - Si la lista esta cerrada, y el foco lo posee el input de la lista al cambiar de ventana en el SO y volver a la 
 *  ventana actual, el navegador le da el foco al input, que al estar la lista cerrada la despliega. Esto no deberia pasar
 *  y la lista deberia permanecer cerrada.
 */
angular.module('adminPanel').directive('apSelect', [
    '$timeout', '$rootScope', '$q',
    function ($timeout, $rootScope, $q) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                reosource: '=',
                search: '=?',
                method: '=?',
                names: '='
            },
            link: function (scope, elem, attr, ngModel) {
                elem.addClass('select-ap');
                
                //habilitamos el boton para agregar entidades
                scope.enableNewButton = !(angular.isUndefined(attr.new) || attr.new === null);
                
                //obtenemos el nombre del select dado el atributo name
                var name = angular.isUndefined(attr.name) ? 'default' : attr.name;
                
                //se definen las propiedades del objeto a mostrar.
                var objectProperties = angular.isArray(scope.names) ? scope.names : scope.names.split(',');
                
                //elemento seleccionado 
                var itemSelected = null;

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
                var request = null;
                
                /**
                 * Funcion que convierte un objeto a un item de la lista segun las propiedades especificadas
                 * en la propiedad names de la directiva
                 * 
                 * @param {Object} object
                 * @returns {Object} 
                 */
                function convertObjectToItemList(object) {
                    var name = '';
                    //Seteamos solamente los campos seleccionados a mostrar
                    for(var j = 0; j < objectProperties.length; j++) {
                        name += object[objectProperties[j]] + ', ';
                    }
                    //borramos la ultima coma
                    name = name.replace(/,\s*$/, "");
                    
                    return {
                        name: name,
                        id: object.id
                    };
                }
                
                /**
                 * Se realiza el request. En caso de haber uno en proceso se lo cancela
                 * Emite un evento en donde se manda la promise.
                 * 
                 */
                function doRequest() {
                    if(request) {
                        request.$cancelRequest();
                    }
                    request = scope.reosource[defaultMethod]();
                    
                    //seteamos en la vista que el request esta en proceso
                    scope.loading = true;
                    var promise = request.$promise.then(function(rSuccess) {
                        
                        //creamos la lista. Cada item es de la forma 
                        //{name:'name',id:'id'}
                        var list = [];
                        for(var i = 0; i < rSuccess.data.length; i++) {
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
                        scope.loading = false;
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
                    
                    console.log('cerrar lista');
                    
                    //cerramos la lista
                    scope.lista.desplegado = false;
                    
                    //si hay un request en proceso se lo cancela
                    if(request) {
                        request.$cancelRequest();
                    }

                    //seteamos el estado actual del modelo 
                    scope.input.model = (itemSelected === null) ? '' : itemSelected.name;
                    scope.input.vacio = (itemSelected === null);
                }
                
                /**
                 * Por ahora la lista se abre solo en el foco al input
                 */
                function openList() {
                    //en caso de haber una promesa activa para cerrar la lista no se la vuelve a abrir
                    if(timeoutCloseListPromise !== null) {
                        return;
                    }
                    
                    console.log('abrir lista');
                    //se abre la lista
                    scope.lista.desplegado = true;
                    //si la lista interna esta vacia se hace el request
                    if (scope.lista.items.length === 0) {
                        doRequest();
                    }
                }
                
                //eventos relacionados con el input
                
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
                 * Se despliega la lista si no esta desplegada.
                 * Solo se hace el request si la lista interna esta vacia
                 */
                scope.onFocusInput = function () {
                    console.log('onFocusInput');
                    
                    if(!scope.lista.desplegado) {
                        console.log('onFocusInput timeoutOpenListPromise created');
                        timeoutOpenListPromise = $timeout(openList).finally(function() {
                            console.log('onFocusInput timeoutOpenListPromise resolved');
                            timeoutOpenListPromise = null;
                        });
                    }
                };
                
                /**
                 * Se usa el $timeout que retorna una promesa. Si el click proximo viene dado por un evento dentro
                 * del select se cancela la promesa. Caso contrario, se ejecuta este codigo
                 */
                scope.onBlurInput = function() {
                    console.log('onBlurInput');
                    if(timeoutOpenListPromise !== null) {
                        $timeout.cancel(timeoutOpenListPromise);
                        timeoutOpenListPromise = null;
                        console.log('onBlurInput timeoutOpenListPromise cancelled', timeoutOpenListPromise);
                    }
                    
                    
                    timeoutCloseListPromise = $timeout(closeList, 100).finally(function() {
                        console.log('onBlurInput timeoutCloseListPromise resolved finally');
                        timeoutCloseListPromise = null;
                    });
                    console.log('onBlurInput timeoutCloseListPromise created');
                };
                
                //eventos relacionados con el boton
                /**
                 * Hace un toggle de la lista, es decir si esta desplegada, la cierra y sino la abre
                 * En caso de que la lista este desplegada no se hace nada, ya que el evento blur del input cierra la lista
                 * Si no está desplegada, la despliega, viendo de hacer o no el request, segun la lista interna tenga
                 * tenga o no elementos.
                 */
                scope.onClickButton = function() {
                    console.log('onClickButton');
                    
                    if(!scope.lista.desplegado) {
                        if(timeoutCloseListPromise !== null) {
                            $timeout.cancel(timeoutCloseListPromise);
                            timeoutCloseListPromise = null;
                            console.log('onClickButton timeoutCloseListPromise canceled', timeoutCloseListPromise); 
                        }

                        console.log('onClickButton give focus input'); 
                        //le damos el foco al input
                        elem.find('input').focus();
                    } 
                };
                
                scope.onFocusButton = function() {

                };
                
                //eventos relacionados con la lista
                
                /**
                 * Al seleccionar un item de la lista se guarda en el modelo y la lista pasa a estado no desplegado
                 * El menu se cierra dado el timeout del evento blur, que se dispara al hacer click sobre un item de la lista
                 */
                scope.onClickItemList = function(e, item) {
                    console.log('onClickItemList');
                    e.stopPropagation();
                    
                    //seteamos el item actual
                    itemSelected = item;
                    
                    //asignamos el id de la entidad al modelo
                    ngModel.$setViewValue(item);
                    
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
                        console.log('onListClick timeoutCloseListPromise canceled', timeoutCloseListPromise);
                    }
                }
                
                /**
                 * Se ejecuta cuando el usuario da click al boton nuevo.
                 * Lanza el evento para mostrar el box correspondiente
                 */
                scope.newObject = function () {
                    $rootScope.$broadcast('apBox:show', attr.new);
                };
                
                //registramos los eventos
                elem.on('click', '.dropdown-ap', onListClick);
                
                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (val) {
                    if (val) {
                        console.log('val',val);
                        
                        //seteamos el item actual
                        itemSelected = convertObjectToItemList(val);
                        
                        //seteamos el estado actual del modelo 
                        scope.input.model = (itemSelected === null) ? '' : itemSelected.name;
                        scope.input.vacio = (itemSelected === null);
                    }
                });
                
                /**
                 * Liberamos los eventos que hayan sido agregados a los 
                 */
                var destroyEventOnDestroy = scope.$on('$destroy', function() {
                    elem.off('click', '.dropdown-ap', onListClick);
                    destroyEventOnDestroy();
                });
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);
