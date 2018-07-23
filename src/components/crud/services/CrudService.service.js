angular.module('adminPanel.crud').service('CrudService', [
    '$timeout','CrudConfig', '$location',
    function($timeout, CrudConfig, $location) {
        /**
         * @description Objeto que tiene dos funciones, submit e init. Realiza las funciones de consulta y actualizacion
         * de formulario. Debe haber un solo de estos elementos por formulario.
         *
         * @param {Scope} scope Scope al cual apunta los eventos
         * @param {CrudResource} Resource | Resource que se utiliza para hacer las peticiones al servidor
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @param {Object} extraParams | Parámetros extras que se añadirán al método GET y POST del Resource que recibe el formulario
         * @returns {CrudService.serviceL#3.Form}
         */
        var Form = function(scope, Resource, apLoadName, file, extraParams) {
            var self = this;
            extraParams = extraParams ? extraParams : {};
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
                var request = Resource.get(Object.assign({}, object, extraParams));
                request.$promise.then(function(responseSuccess) {
                    scope.$emit('apLoad:finish', apLoadName);
                    if(callbackSuccess) {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    console.log('responseError',responseError);
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
                console.log('object', object);
                var request = Resource.save(extraParams, object);

                //Se hace el request para guardar el objeto
                request.$promise.then(function(responseSuccess) {
                    //Si no hay archivos se sigue el curso actual
                    if(file === null || angular.isUndefined(file)) {
                        scope.$emit('apLoad:finish', apLoadName, {
                            message: CrudConfig.messages.saveSuccess,
                            type: 'success'
                        });
                        if(callbackSuccess) {
                            callbackSuccess(responseSuccess);
                        }
                    } else {
                        var requestFile = Resource[file.prop](responseSuccess.data);
                        requestFile.$promise.then(function(fileResponseSuccess) {
                            scope.$emit('apLoad:finish', apLoadName, {
                                message: CrudConfig.messages.saveSuccess,
                                type: 'success'
                            });
                            if(callbackSuccess) {
                                callbackSuccess(fileResponseSuccess);
                            }
                        }, function(fileResponseError) {
                            scope.$emit('apLoad:finish', apLoadName, {
                                message: CrudConfig.messages.saveError,
                                type: 'error'
                            });
                            if(callbackError) {
                                callbackError(fileResponseError);
                            }
                            throw 'Form File Error: ' + fileResponseError;
                        });
                    }
                }, function(responseError) {
                    var errorData = {};
                    transformErrorData(responseError.data, errorData);

                    if (errorData.errors.length > 0) {
                        scope.$emit('apLoad:finish', apLoadName, {
                            title: CrudConfig.messageTitles.saveError,
                            message: errorData.errors,
                            type: 'error'
                        });
                    } else {
                        scope.$emit('apLoad:finish', apLoadName, {
                            message: CrudConfig.messages.saveError,
                            type: 'error'
                        });
                    }
                    if(callbackError) {
                        callbackError(responseError);
                    }
                    throw 'Form Error: ' + responseError;
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
         * @description Función que crea un objeto con los mensajes de error a partir de la respuesta de symfony
         *
         * @param {Object} dataObj Objeto data de la respuesta de symfony
         * @param {type} newData Objeto donde se guarda el arreglo de errores
         * @returns {undefined}
         */
        function transformErrorData(dataObj, newData) {
            if(angular.isUndefined(newData.errors)) {
                newData.errors = [];
            }
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

        /**
         * @description Inicializa el controlador del componente para tener el formulario del servidor
         *
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {Funciton} callbackInit funcion que puede ser ejecutada luego del init
         * @param {Funciton} function que puede ser ejecutada luego del submit
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @param {Object} extraParams | Parámetros extras que se van a agregar en las requests. Ej: blog/:blogId/message/:messageId -> extraParams = {blogId: 23}
         * @returns {undefined}
         */
        function BasicFormController(controller, resource, scope, callbackInit, callbackSubmit, apLoadName, extraParams) {
            var name = resource.name;
            extraParams = extraParams ? extraParams : {};
            var form = new Form(scope, resource.$resource, apLoadName, resource.file, extraParams);
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
                                scope[name][property] = r.data[property];
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
         * @param {Object} defaultParams | Parámetros que se van a agregar en todas las requests. Ej: blog/:blogId/message/:messageId -> defaultParams = {blogId: 23}
         * @returns {undefined}
         */
        function BasicListController(controller, resource, scope, apLoadName, defaultParams) {
            scope.list = [];
            defaultParams = defaultParams ? defaultParams : {};
            var List = new ListFn(scope, resource.$resource, apLoadName);

            controller.$onInit = function () {
                controller.list();
            };

            controller.list = function(params, actionDefault, callback) {
                var listParams = Object.assign($location.search(), params);
                var allParams = Object.assign({}, listParams, defaultParams);
                List.get(allParams, function(r) {
                    scope.list = r.data;
                    scope.$broadcast('pagination:paginate', {
                        totalPageCount: r.totalPageCount,
                        currentPageNumber: r.currentPageNumber
                    });
                    $location.search(listParams);
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
