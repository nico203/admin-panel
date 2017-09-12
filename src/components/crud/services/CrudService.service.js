angular.module('adminPanel.crud').service('CrudService', [
    '$timeout','CrudConfig',
    function($timeout, CrudConfig) {
        /**
         * @description Objeto que tiene dos funciones, submit e init. Realiza las funciones de consulta y actualizacion
         * de formulario. Debe haber un solo de estos elementos por formulario.
         * 
         * @param {Scope} scope Scope al cual apunta los eventos
         * @param {CrudResource} Resource | Resource que se utiliza para hacer las peticiones al servidor
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {CrudService.serviceL#3.Form}
         */
        var Form = function(scope, Resource, apLoadName) {
            var self = this;
            /**
             * @description metodo que inicializa el formulario con datos del servicor.
             * 
             * @param {Object} object Objeto a enviar al servidor para hacer la consulta 
             * @param {type} callbackSuccess Funcion que se llama si la peticion es exitosa
             * @param {type} callbackError Funcion que se llama si hubo un error en la peticion.
             * @returns {undefined}
             */
            self.init = function(object, callbackSuccess, callbackError) {
                scope.$emit('apLoad:start',apLoadName);
                var request = Resource.get(object);
                request.$promise.then(function(responseSuccess) {
                    scope.$emit('apLoad:finish', apLoadName);
                    if(callbackSuccess) {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.loadError,
                        type: 'error'
                    });
                    if(callbackError) {
                        callbackError(responseError);
                    }
                });
                
                //aregamos el request al scope para poderlo cancelar
                self.initRequest = request;
            };

            /**
             * @description Metodo que envia los datos del formulario al servidor para hacer la actualizacion
             * 
             * @param {Object} object Objeto a enviar al servidor para persistir los datos. 
             * @param {type} callbackSuccess Funcion que se llama si la peticion es exitosa
             * @param {type} callbackError Funcion que se llama si hubo un error en la peticion.
             * @returns {undefined}
             */
            self.submit = function(object, callbackSuccess, callbackError) {
                scope.$emit('apLoad:start',apLoadName);
                var request = Resource.save(object);
                request.$promise.then(function(responseSuccess) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.saveSusccess,
                        type: 'success'
                    });
                    if(callbackSuccess) {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.saveError,
                        type: 'error'
                    });
                    if(callbackError) {
                        callbackError(responseError);
                    }
                });
                
                //aregamos el request al scope para poderlo cancelar
                self.submitRequest = request;
            };
            
            
            //cancelamos los request
            self.destroy = function() {
                if(self.initRequest) {
                    self.initRequest.$cancelRequest();
                }
                if(self.submitRequest) {
                    self.submitRequest.$cancelRequest();
                }
            };
        };
        
        /**
         * @description Lista los objetos en la vista que son obtenidos del servidor
         * 
         * @param {Scope} scope Scope al cual apunta los eventos
         * @param {CrudResource} Resource | Resource que se utiliza para hacer las peticiones al servidor
         * @param {String} apLoadName Nombre de la directiva load a usar. Si no se especifica, se usa la directiva por default.
         * @returns {CrudService.serviceL#3.ListFn}
         */
        var ListFn = function(scope, Resource,apLoadName) {
            var request = null;
            /**
             * @description Realiza el pedido de objetos al servidor para listar
             * 
             * @param {Object} object Objeto a buscar en el servidor
             * 
             * @param {function} callbackSuccess Funcion que se llama si la peticion es exitosa
             * 
             * @param {function} callbackError Funcion que se llama si hubo un error en la peticion.
             * 
             * @param {String} actionDefault Metodo a ejecutar del CrudResource
             * @default 'get'
             * 
             * @returns {undefined}
             */
            this.get = function (object, callbackSuccess, callbackError, actionDefault) {
                //timeout requerido para terminar el binding de los componentes de la aplicacion
                //termina el ciclo digest
                $timeout(function () {
                    scope.$broadcast('apLoad:start',apLoadName);
                    var action = (actionDefault) ? actionDefault : 'get';

                    if(request && !request.$promise.$resolved) {
                        request.$cancelRequest();
                    }
                    request = Resource[action](object);
                    request.$promise.then(function(responseSuccess) {
                        scope.$broadcast('apLoad:finish',apLoadName);
                        if(callbackSuccess) {
                            callbackSuccess(responseSuccess);
                        }
                    }, function(responseError) {
                        if(responseError.status === -1) return;
                        scope.$broadcast('apLoad:finish',apLoadName, {
                            message: CrudConfig.messages.loadError,
                            type: 'error'
                        });
                        if(callbackError) {
                            callbackError(responseError);
                        }
                    });
                    
                    //aregamos el request al scope para poderlo cancelar
                    scope.request = request;
                });
            };
        };
        
        /**
         * @description Inicializa el controlador del componente para tener el formulario del servidor
         * 
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {Funciton} callbackInit funcion que puede ser ejecutada luego del init
         * @param {Funciton} function que puede ser ejecutada luego del submit
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {undefined}
         */
        function BasicFormController(controller, resource, scope, callbackInit, callbackSubmit, apLoadName) {
            var name = resource.name;
            var form = new Form(scope, resource.$resource, apLoadName);
            scope[name] = {};
            
            scope.submit = function() {
                if(!scope.form) {
                    form.submit(scope[name], function(r) {
                        if(r.data) {
                            scope[name] = r.data;
                        }
                        if(callbackSubmit) {
                            callbackSubmit();
                        }
                    });
                }
                else if(scope.form.$valid) {
                    form.submit(scope[name], function(r) {
                        if(r.data) {
                            scope[name] = r.data;
                        }
                        if(callbackSubmit) {
                            callbackSubmit();
                        }
                    });
                }
            };

            controller.$onInit = function() {
                var property = resource.property;
                
                if(angular.isUndefined(this[name]) || this[name] === null) {
                    throw 'BasicFormController: el nombre del recurso debe estar definido';
                }
                
                //esta definida la propiedad, es decir tiene un sub recurso 
                // pero este proviene de otro lugar y no hay que obtenerlo del servidor
                if(property && !(angular.isUndefined(this[name][property]) || this[name][property] === null)) {
                    scope[name] = this[name];
                    if(scope[name][property]) {
                        scope[property] = scope[name][property];
                    } else {
                        scope[name][property] = scope[property];
                    }
                    if(callbackInit) {
                        callbackInit();
                    }
                    return;
                } 
                //los datos se obtienen del servidor 
                if(this[name] && this[name] !== 'nuevo') {
                    var obj = {};
                    obj[name] = this[name];
                    form.init(obj, function(r) {
                        scope[name] = r.data;
                        if(property) {
                            if(scope[name][property]) {
                                scope[property] = scope[name][property];
                            } else {
                                scope[name][property] = {};
                            }
                        } 
                        if(callbackInit) {
                            callbackInit();
                        }
                    });
                }
            };
            
            //cancelamos los request al destruir el controller
            controller.$onDestroy = function() {
                form.destroy();
            };
        }
        
        /**
         * @description Inicializa el controlador del componente para listar entidades del servidor
         * 
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {undefined}
         */
        function BasicListController(controller, resource, scope, apLoadName) {
            scope.list = [];
            var List = new ListFn(scope, resource.$resource, apLoadName);
            
            controller.$onInit = function () {
                controller.list();
            };
            
            controller.list = function(params, actionDefault, callback) {
                var listParams = (params) ? params : {};
                List.get(listParams, function(r) {
                    scope.list = r.data;
                    scope.$broadcast('pagination:paginate', {
                        totalPageCount: r.totalPageCount,
                        currentPageNumber: r.currentPageNumber
                    });
                    if(callback) callback();
                }, function(){}, actionDefault);
            };
            
            //cancelamos los request al destruir el controller
            controller.$onDestroy = function() {
                if(scope.request) {
                    scope.request.$cancelRequest();
                }
            };
            
            scope.$on('pagination:changepage', function(e, page) {
                e.stopPropagation();
                controller.list({
                    page: page
                });
            });
        }
        
        
        return {
            form: Form,
            list: ListFn,
            basicFormController: BasicFormController,
            basicListController: BasicListController
        };
    }
]);
