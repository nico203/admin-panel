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
                //habilitamos el boton para agregar entidades
                scope.enableNewButton = !(angular.isUndefined(attr.new) || attr.new === null);
                
                //obtenemos el nombre del select dado el atributo name
                var name = angular.isUndefined(attr.name) ? 'default' : attr.name;
                console.log('apSelect name',name);
                
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
                var timeoutPromise = null;
                var defaultMethod = (angular.isUndefined(scope.method) || scope.method === null) ? 'get' : scope.method;
                var request = null;
                
                /**
                 * Se realiza el request. En caso de haber uno en proceso se lo cancela
                 * Emite un evento en donde se manda la promise.
                 */
                function doRequest() {
                    if(request) {
                        request.$cancelRequest();
                    }
                    request = scope.reosource[defaultMethod]();
                    
                    var promise = request.$promise.then(function(rSuccess) {
                        scope.lista.items = rSuccess.data;
                        if(!scope.lista.desplegado) {
                            scope.lista.desplegado = true;
                        }
                        
                        return rSuccess.data;
                    }, function(rError) {
                        $q.reject(rError);
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

                    //vaciamos la promesa
                    timeoutPromise = null;
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
                    if (!scope.lista.desplegado) {
                        scope.lista.desplegado = true;
                        //si la lista interna esta vacia se hace el request
                        if(scope.lista.items.length === 0) {
                            doRequest();
                        }
                    } 
                };
                
                /**
                 * Se usa el $timeout que retorna una promesa. Si el click proximo viene dado por un evento dentro
                 * del select se cancela la promesa. Caso contrario, se ejecuta este codigo
                 */
                scope.onBlurInput = function() {
                    timeoutPromise = $timeout(closeList(), 100);
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
                    if(!scope.lista.desplegado) {
                        //le damos el foco al input
                        elem.find('.input-group-field').focus();
                    } else if(scope.lista.desplegado) {
                        if(timeoutPromise !== null) {
                            $timeout.cancel(timeoutPromise);
                        }
                        closeList();
                    } 
                };
                
                //eventos relacionados con la lista
                
                /**
                 * Al seleccionar un item de la lista se guarda en el modelo y la lista pasa a estado no desplegado
                 */
                scope.onClickItemList = function(item) {
                    //seteamos el item actual
                    itemSelected = item;
                    
                    //asignamos el id de la entidad al modelo
//                    ngModel.$setViewValue(item.id);
                    if(timeoutPromise !== null) {
                        $timeout.cancel(timeoutPromise);
                    }
                    closeList();
                    
                    //emitimos un evento al seleccionar un item, con el item y el nombre del elemento que se selecciono
                    scope.$emit('ap-select:item-selected', name, item);
                };
                
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);
