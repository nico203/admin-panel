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
                var timeoutBlurPromise = null;
                var timeoutFocusPromise = null;
                var defaultMethod = (angular.isUndefined(scope.method) || scope.method === null) ? 'get' : scope.method;
                var request = null;
                
                /**
                 * Se ejecuta cuando el usuario da click al boton nuevo.
                 * Lanza el evento para mostrar el box correspondiente
                 */
                scope.newObject = function () {
                    $rootScope.$broadcast('apBox:show', attr.new);
                };
                
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
                            var itemList = rSuccess.data[i];
                            var name = '';
                            //Seteamos solamente los campos seleccionados a mostrar
                            for(j = 0; j < objectProperties.length; j++) {
                                name += itemList[objectProperties[j]] + ', ';
                            }
                            //borramos la ultima coma
                            name = name.replace(/,\s*$/, "");
                            list.push({
                                name: name,
                                id: itemList.id
                            });
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
                
                function closeList() {
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
                    //en caso de haber una promesa para cerrar la lista en el foco no se hace nada
                    //cuando se resuelve la promesa se limpia la variable
                    if(timeoutBlurPromise !== null) {
                        return;
                    }
                    
                    console.log('onFocusInput timeoutFocusPromise created');
                    timeoutFocusPromise = $timeout(function() {
                        if (!scope.lista.desplegado) {
                            scope.lista.desplegado = true;
                            //si la lista interna esta vacia se hace el request
                            if(scope.lista.items.length === 0) {
                                doRequest();
                            }
                        } 
                    }).finally(function() {
                        console.log('onFocusInput timeoutFocusPromise resolved');
                        timeoutFocusPromise = null;
                    });
                };
                
                /**
                 * Se usa el $timeout que retorna una promesa. Si el click proximo viene dado por un evento dentro
                 * del select se cancela la promesa. Caso contrario, se ejecuta este codigo
                 */
                scope.onBlurInput = function() {
                    console.log('onBlurInput');
                    if(timeoutFocusPromise !== null) {
                        console.log('onBlurInput timeoutFocusPromise cancelled');
                        $timeout.cancel(timeoutFocusPromise);
                        timeoutFocusPromise = null;
                    }
                    
                    console.log('onBlurInput timeoutBlurPromise created');
                    timeoutBlurPromise = $timeout(closeList, 100).finally(function() {
                        console.log('onBlurInput timeoutBlurPromise resolved');
                        timeoutBlurPromise = null;
                    });
                };
                
                //eventos relacionados con el boton
                /**
                 * Hace un toggle de la lista, es decir si esta desplegada, la cierra y sino la abre
                 * En caso de que la lista este desplegada la cierra, cancelando el timeout que se genera al perder
                 * el foco del input, en caso de que el input haya tenido el foco.
                 * Al cerrar la lista se setea en el input el valor del modelo actual.
                 * Si no está desplegada, la despliega, viendo de hacer o no el request, segun la lista interna tenga
                 * tenga o no elementos.
                 */
                scope.onClickButton = function() {
                    console.log('onClickButton');
                    if(!scope.lista.desplegado) {
                        console.log('onClickButton give focus input'); 
                        //le damos el foco al input
                        elem.find('input').focus();
                    } else if(scope.lista.desplegado) {
                        if(timeoutBlurPromise !== null) {
                            console.log('onClickButton timeoutBlurPromise canceled'); 
                            $timeout.cancel(timeoutBlurPromise);
                            timeoutBlurPromise = null;
                        }
                        closeList();
                    } 
                };
                
                scope.onFocusButton = function() {
                };
                
                //eventos relacionados con la lista
                
                /**
                 * Al seleccionar un item de la lista se guarda en el modelo y la lista pasa a estado no desplegado
                 */
                scope.onClickItemList = function(e, item) {
                    console.log('onClickItemList');
                    e.stopPropagation();
                    
                    //seteamos el item actual
                    itemSelected = item;
                    
                    //asignamos el id de la entidad al modelo
//                    ngModel.$setViewValue(item.id);
                    
                    //cancelamos la funcion del blur
                    if(timeoutBlurPromise !== null) {
                        console.log('onClickItemList timeoutBlurPromise canceled');
                        $timeout.cancel(timeoutBlurPromise);
                        timeoutBlurPromise = null;
                    }
                    if(scope.lista.desplegado) {
                        console.log('onClickItemList timeoutBlurPromise created');
                        timeoutBlurPromise = $timeout(closeList, 100).finally(function() {
                            console.log('onClickItemList timeoutBlurPromise resolved');
                            timeoutBlurPromise = null;
                        });
                    }
                    
                    //emitimos un evento al seleccionar un item, con el item y el nombre del elemento que se selecciono
                    scope.$emit('ap-select:item-selected', name, item);
                };
                
                /**
                 * Al hacer click en la lista se cancela el evento para no cerrar la lista
                 */
                scope.onListClick = function() {
                    if(timeoutBlurPromise !== null) {
                        timeoutBlurPromise = $timeout.cancel(timeoutBlurPromise);
                        timeoutBlurPromise = null;
                    }
                };
                
                elem.find('.dropdown-ap').on('click', scope.onListClick);
                
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);
