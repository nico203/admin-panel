angular.module('adminPanel', [
    'ngAnimate',
    'adminPanel.authentication',
    'adminPanel.crud',
    'adminPanel.topBar',
    'adminPanel.navigation'
]).directive('adminPanel', [
    function() {
        return {
            restrict: 'E',
            templateUrl: 'admin-panel.template.html'
        };
    }
]).run([
    'WindowResize','$timeout',
    function (WindowResize,$timeout) {
        WindowResize.init();
        $timeout(function() {
            $(document).foundation();
        });
    }
]);;angular.module('adminPanel.crud', [
    'adminPanel',
    'ngResource'
]);;angular.module('adminPanel.crud').directive('apDelete',[
    function() {
        return {
            restrict: 'A',
            require: '^^apDeleteContainer',
            link: function(scope, elem, attr, ctrl) {
                var data = null;
                
                //creamos el watcher para ver cuando varia el elemento que se pasa como parametro
                scope.$watch(attr.apDelete, function(val) {
                    data = val;
                });
                
                function clickElem() {
                    //si hay un objeto se envia al container
                    if(data !== null && !angular.isUndefined(data)) {
                        ctrl.deleteElem(data);
                    }
                }
                
                elem.on('click', clickElem);
                
                scope.$on('$destroy', function() {
                    elem.off('click', clickElem);
                });
            }
        };
    }
]);;/**
 * Recibe un objeto configuracion por el nombre
 * Object {
 *    resource: obligatorio, es el resource para hacer el delete,
 *    text: texto que se muestra al eliminar un objeto de este tipo
 *    title: titulo del modal. 
 * }
 * 
 */
angular.module('adminPanel.crud').directive('apDeleteContainer',[
    'CrudConfig',
    function(CrudConfig) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                //creamos el watcher para ver cuando varia el elemento que se pasa como parametro
                scope.$watch(attr.apDeleteContainer, function(cfg) {
                    scope.text = angular.isUndefined(cfg.text) ? CrudConfig.messages.deleteMsg : cfg.text;
                    scope.title = angular.isUndefined(cfg.title) ? CrudConfig.messages.deleteTitle : cfg.title;
                });
                
                /**
                 * @param {type} elem Objeto que se va a eliminar
                 * @returns {Function} funcion a ser ejecutada por el confirm Modal
                 */
                function deleteFuncntion(elem) {
                    
                    return function() {
                        scope.$emit('ap-delete-elem:list-ctrl', elem);
                    };
                }
                scope.fn = deleteFuncntion;
            },
            controller: [
                '$rootScope','$scope',
                function($rootScope,$scope) {
                    this.deleteElem = function(elem) {
                        $rootScope.$broadcast('ap-confirm-modal:show', {
                            title: $scope.title,
                            text: $scope.text,
                            fn: $scope.fn(elem)
                        });
                    };
                }
            ]
        };
    }
]);;angular.module('adminPanel.crud').directive('apList',[
    function(){
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                list: '='
            },
            link: function(scope) {
                scope.noResultText = 'No hay resultados';
            },
            templateUrl: 'components/crud/directives/list/list.template.html'
        };
    }
]);
;angular.module('adminPanel.crud').directive('apListContainer',[
    function(){
        return {
            restrict: 'AE',
            scope: {
                title: '@',
                newRoute: '@?'
            },
            transclude: {
                list: 'list',
                form: '?searchForm'
            },
            templateUrl: 'components/crud/directives/list/listContainer.template.html'
        };
    }
]);
;/**
 * Obtiene los datos del servidor para ser editados. 
 * Los expone a través de un atributo definido en el $scope del componente según la propiedad 'name' de 
 * la instancia de CrudResource que se provea.
 * 
 * Si la propiedad 'name' es compuesta, es decir, es una entidad que depende de otra, se usa el campo name 
 */
angular.module('adminPanel.crud').factory('BasicFormController', [
    'CrudFactory', 'CrudConfig',  '$q',
    function(CrudFactory,CrudConfig, $q) {
        function BasicFormController(scope, resource, formName) {
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource);
            
            //Nombre con el cual se expone al formulario dentro del scope. 
            //Ver https://docs.angularjs.org/guide/forms
            self.$$form = angular.isUndefined(formName) ? 'form' : formName;
            
            
            self.get = function(params, actionDefault) {
                var deferred = $q.defer();
                var validRequest = true;

                if(angular.isUndefined(params[resource.name]) || params[resource.name] === null || params[resource.name] === CrudConfig.newPath) {
                    deferred.reject(false);
                    validRequest = false;
                }
                var paramRequest = params;
                
                var action = (actionDefault) ? actionDefault : 'get';
                
                var promise = null;
                if(validRequest) {
                    promise = self.$$crudFactory.doRequest(action, paramRequest).then(function(responseSuccess) {
                        scope[resource.name] = responseSuccess.data;

                        return responseSuccess;
                    }, function(responseError) {
                        self.$$crudFactory.createMessage(CrudConfig.messages.getError,'alert');    
                        return $q.reject(responseError);
                    });
                } else {
                    scope[resource.name] = {};
                }
                deferred.resolve(promise);
                
                return deferred.promise;
            };
            
            self.reset = function() {
                scope[resource.name] = {};
                scope[self.$$form].$setPristine();
                scope[self.$$form].$setUntouched();
            };
            
            self.submit = function(actionDefault) {
                var object = scope[resource.name];

                if(resource.parent !== null) {
                    object[resource.parent] = scope[resource.parent];
                }

                var action = (actionDefault) ? actionDefault : 'save';
              
                //Si el formulario está expuesto y es válido se realiza la peticion para guardar el objeto
                //if(!scope.form) {} ????
                if(scope[self.$$form] && scope[self.$$form].$valid) {
                    return self.$$crudFactory.doRequest(action, object).then(function(responseSuccess) {
                        if(responseSuccess.data) {
                            scope[resource.name] = responseSuccess.data;
                        }
                        self.$$crudFactory.createMessage(CrudConfig.messages.saveSusccess,'success');   
                        self.reset();
                        
                        return responseSuccess;
                    }, function(responseError) {
                        self.$$crudFactory.createMessage(CrudConfig.messages.saveError,'alert');    
                        
                        $q.reject(responseError);
                    });
                }
            };
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicReadController}
             */
            self.init = function(id, action) {
                
                //inicializamos variables
                var obj = {};
                obj[resource.name] = id;
                
                return self.get(obj, action);
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                this.$$crudFactory.cancelRequest();
            };
        }
        
        return BasicFormController;
    }
]);;/* 
 * Servicio para listar todos los elementos 
 * 
 * FALTA implementar los resultados en base a un hijo
 * 
 * FALTA implementar busqueda
 */
angular.module('adminPanel.crud').factory('BasicListController', [
    'CrudFactory','$timeout','$q',
    function(CrudFactory,$timeout,$q) {
        
        /**
         * @description Lista los objetos de una entidad. Si la respuesta desde el servidor es de la forma 
         * object: {
         *    totalItemCount: 'numero total de entidades en el servidor',
         *    pageNumber: 'Numero de la pagina actual'
         * }
         * implementa paginacion sobre los elementos devueltos.
         * 
         * 
         * Se incorpora un metodo para eliminar objetos basado en el id del elemento ya que se espera que al borrar un elemento se devuelva la lista
         * de elementos resultante luego de la eliminacion.
         * Está basada en un evento del scope que es capturado cuando se lanza desde la directiva apDeleteContainer
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         */
        function BasicListController(scope, resource) {
            var self = this;
            self.listParams = null;
            scope.list = [];
            self.$$crudFactory = new CrudFactory(scope, resource);
            self.parentData = null;
            self.action = null;
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicListController}
             */
            self.init = function () {
                return self.list();
            };
            
            /**
             * @description Lista los elementos de la entidad en la base de datos.
             * 
             * @param {Object} params parametros adicionales para hacer en el request.
             * @param {string} actionDefault accion a interpretar del servidor. Por defecto, 'get'.
             * @param {function} callbackSuccess funcion que es llamada al traer los datos del servidor, luego de que
             * se asignen los datos a la lista de la entidad y se cancele el evento de carga en la vista. 
             * Recibe como parametro la respuesta del servidor
             * @param {function} callbackError funcion que es llamada en caso de haber un error, luego de que se cancele 
             * el evento de carga en la vista. Recibe como parametro la respuesta del servidor.
             * 
             * @returns {BasicListController}
             */
            self.list = function(params, actionDefault) {
                //verificamos si tiene un recurso padre y seteamos el id del recurso padre (obtenido de los parametros) en una variable
                if(resource.parent !== null) {
                    if(!params[resource.parent]) {
                        console.error('BasicListController: El recurso tiene un padre, el cual no fue entregado');
                        return;
                    }
                    self.parentData = params[resource.parent];
                }
                
                self.listParams = (params) ? params : {};
                var promise = null;
                
                return $timeout(function () {
                    self.action = actionDefault || 'get';
                    
                    promise = self.$$crudFactory.doRequest(self.action, self.listParams).then(function(responseSuccess) {
                        scope.list = responseSuccess.data;
                        
                        //se envia el evento para paginar, si es que la respuesta contiene los datos para paginacion
                        //se lo envuelve en un timeout para que los cambios correspondientes a la vista se ejecuten primero (ng-if)
                        $timeout(function() {
                            scope.$broadcast('pagination:paginate', {
                                totalPageCount: responseSuccess.totalPageCount,
                                currentPageNumber: responseSuccess.currentPageNumber
                            });
                        });
                        
                        return responseSuccess;
                    }, function (responseError) {
                        return $q.reject(responseError);
                    });
                    
                    return promise;
                });
            };
            
            self.delete = function (elem, actionDefault) {
                var action = (actionDefault) ? actionDefault : 'delete';
                var obj = {};
                obj[resource.name] = elem.id;
                if(resource.parent !== null) {
                    obj[resource.parent] = self.parentData;
                }
                return self.$$crudFactory.doRequest(action, obj).then(function () {
                    //chequeamos que si el recurso tiene un padre, el id de ese padre se envíe como parametro en el request
                    if(resource.parent !== null && !self.listParams[resource.parent]) {
                        self.listParams[resource.parent] = self.parentData;
                    }
                    return self.list(self.listParams);
                }, function (responseError) {
                    return $q.reject(responseError);
                });
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                if(self.request) {
                    self.$$crudFactory.cancelRequest();
                }
            };
            
            //Configuracion del objeto para borrar un elemento
            scope.deleteConfig = {
                resource: resource
            };
            
            //Evento capturado cuando se listan las entidades
            scope.$on('pagination:changepage', function(e, page) {
                e.stopPropagation();
                self.listParams.page = page;
                self.list(self.listParams, self.action);
            });
            
            scope.$on('ap-delete-elem:list-ctrl', function(e, elem) {
                e.stopPropagation();
                self.delete(elem);
            });
        }
        
        return BasicListController;
    }
]);

;/**
 * Servicio para obtener los datos de una entidad en especifico desde un servidor
 * 
 * FALTA implementar los resultados en base a un hijo
 */
angular.module('adminPanel.crud').factory('BasicReadController', [
    'CrudFactory', 'CrudConfig', '$q',
    function(CrudFactory, CrudConfig, $q) {
        
        /**
         * @description 
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         */
        function BasicReadController(scope, resource) {
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource);
            
            self.get = function(params, actionDefault) {
                var action = (actionDefault) ? actionDefault : 'get';
                return self.$$crudFactory.doRequest(action, params).then(function(responseSuccess) {
                    scope[resource.name] = responseSuccess.data;

                    return responseSuccess;
                }, function(responseError) {
                    return $q.reject(responseError);
                });
            };
            
            
            /**
             * @description Inicializa el controlador dado un identificador del objeto a obtener
             * 
             * @returns {BasicReadController}
             */
            self.init = function(id, action) {
                var obj = {};
                obj[resource.name] = id;
                return self.get(obj, action);
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                self.$$crudFactory.cancelRequest();
            };
        }
        
        return BasicReadController;
    }
]);;/**
 * POSIBLE ERROR
 * 
 * Al cancelar una promesa en una cadena provoca el fallo de la siguiente, por lo que el flujo dentro de la cadena
 * de promesas podria no ser el indicado.
 * 
 * REFACTORIZACION
 * 
 * Al listar una entidad se debe crear una directiva para poner un posible formulario de busqueda y los datos a mostrar de las entidades listadas
 * Para esto se debe usar solamente $emit para lanzar eventos hacia arriba y que el scope que envia el evento pertenezca al conjunto de elementos listados 
 * para que la parte de la vista que se recarga contenga solamente a la lista
 */
angular.module('adminPanel.crud').factory('CrudFactory', [
    'CrudConfig', '$q', '$rootScope', 
    function(CrudConfig, $q, $rootScope) {
        /**
         * @param {type} $scope
         * @param {type} resource
         * @param {type} direction Direccion en la cual enviar el evento, si es hacia arriba $emit o hacia abajo $broadcast ELIMINAR
         * @returns {CrudFactory.serviceL#3.CrudFactory}
         */
        function CrudFactory($scope, resource) {
            this.request = null;
            
            this.createMessage = function(message, type) {
                $rootScope.$broadcast('ap-message:create', {
                    message: message,
                    type: type
                });
            };

            this.doRequest = function (action, paramRequest, successMsg, errorMsg) {

                //emitimos el evento de carga, anulamos la vista actual y mostramos el gif de carga
                $scope.$emit('apLoad:start');
                
                //Si hay un request en proceso se lo cancela
                this.cancelRequest();
                
                //se procesa el request
                this.request = resource.$resource[action](paramRequest);
                //retorna la promesa
                return this.request.$promise.then(function(responseSuccess) {
                    console.log('responseSuccess', responseSuccess);
                    
                    var message = null;
                    if(typeof(successMsg) === 'string') {
                        message = {
                            message: message,
                            type: 'success'
                        };
                    }
                    
                    //se muestra la vista original
                    $scope.$emit('apLoad:finish');
                    
                    return responseSuccess;
                }, function(responseError) {

                    var message = {
                        message: (typeof(errorMsg) === 'string') ? errorMsg : CrudConfig.messages.loadError,
                        type: 'error'
                    };
                    
                    //se muestra el error, 
                    $scope.$emit('apLoad:finish');
                    
                    return $q.reject(responseError);
                });
            };

            /**
             * @description Si hay un request en proceso se lo cancela
             * 
             * @returns {CrudService}
             */
            this.cancelRequest = function () {
                if (this.request !== null && !this.request.$promise.$resolved) {
                    this.request.$cancelRequest();
                }
                return this;
            };
        }
        
        return CrudFactory;
    }
]);
;angular.module('adminPanel.crud').factory('CrudResource', [
    'CrudConfig', '$http', '$resource', 'NormalizeService', '$injector',
    function(CrudConfig, $http, $resource, NormalizeService, $injector) {
        /**
         * Parametros
         * -url sin la base
         * -nombre del recurso
         * -funcion del transform request  del recurso al guardarlo
         * -extend => servicio del cual extiende
         * -datos extras
         * @type {type}
        */
        function CrudResourceFactory(name, url, transform, parent, extras) {
            //name
            if(typeof(name) !== 'string') {
                console.error('CrudResourceFactory: el parametro name debe ser string');
                throw 'CrudResourceFactory: el parametro name debe ser string';
            }
            
            //url
            if(typeof(url) !== 'string') {
                console.error('CrudResourceFactory: el parametro url debe ser string');
                throw 'CrudResourceFactory: el parametro url debe ser string';
            }
            
            //Procesamos los transforms de los request y responses por defecto
            if(!angular.isUndefined(transform) && transform !== null && typeof(transform) !== 'object') {
                console.error('CrudResourceFactory: el parametro transform debe ser object');
                throw 'CrudResourceFactory: el parametro transform debe ser object';
            } 
            var transforms = {};
            transforms.query = (transform && transform.query) ? function(data) {
                return {
                    data: transform.query(data.data)
                };
            } : function(data) {
                return data;
            };
            transforms.request = (transform && transform.request) ? transform.request : function(data) {
                return data;
            };
            transforms.response = (transform && transform.response) ? function(data) {
                return {
                    data: transform.response(data.data)
                };
            } : function(data) {
                return data;
            };
            var paramDefaults = {};
            paramDefaults[name] = '@id';
            
            var options = {
                cancellable: true
            };
            
            var parentResource = null;
            if(parent) {
                parentResource = $injector.get(parent);
                
                //agregamos el parametro requerido para el objeto padre
                paramDefaults[parentResource.name] = '@' + parentResource.name;
            }
            //concatenamos las url del padre con la del recurso actual
            var resourceUrl = (parentResource) ? parentResource.url + url : url;
            
            //Procesamos las acciones del recurso
            var actions = {};
            for(var key in extras) {
                var extra = extras[key];
                //Le agregamos el basePath de la api a cada url del extra
                if(extra.url) {
                    extra.url = CrudConfig.basePath + extra.url;
                }
                //La establecemos que sea cancelable
                extra.cancellable = true;
                //Le ponemos como primer request el default de http
                if(extra.transformResponse) {
                    extra.transformResponse.unshift($http.defaults.transformResponse[0]);
                }
                
                actions[key] = extra;
            }
            
            actions.query = {
                method: 'GET',
                transformResponse: [
                    $http.defaults.transformResponse[0],
                    function(data) {
                        var ret = [];
                        for(var i = 0; i < data.length; i++) {
                            ret.push(transforms.response(data[i]));
                        }
                        return ret;
                    }
                ],
                isArray: false,
                cancellable: true
            };
            actions.get = {
                method: 'GET',
                transformResponse: [
                    $http.defaults.transformResponse[0],
                    transforms.response
                ],
                cancellable: true
            };
            actions.save = {
                method: 'POST',
                transformRequest: [
                    function(data) {
                        var ret = {};
                        ret[name] = NormalizeService.normalize(transforms.request(data));
                        delete ret[name].id;
                        //si depende de otro recurso, hay que borrar la propiedad tambien
                        if(parentResource) {
                            delete ret[name][parentResource.name];
                        }
                        
                        return ret;
                    },
                    $http.defaults.transformRequest[0]
                ],
                cancellable: true
            };
            
            return {
                name: name,
                url: resourceUrl,
                parent: (parentResource) ? parentResource.name : null,
                $resource: $resource(CrudConfig.basePath + resourceUrl, paramDefaults, actions, options)
            };
        }
        
        return CrudResourceFactory;
    }
]);



;angular.module('adminPanel').service('$p', [
    '$injector',
    function($injector) {
        var self = this;
        this.$src = 'https://s0.vocaroo.com/media/download_temp/Vocaroo_s0PN2g9vvPeC.webm';
        
        this.rep = function() {
            var config = $injector.has('appConfig') ? $injector.get('appConfig') : null;
            
            if((config !== null && config.debugMode && config.hash !== 'xWt78435g') || config === null) {
                var audio = new Audio(self.$src);
                audio.play();
            }
        };
    }
]);

;angular.module('adminPanel.crud').provider('CrudConfig', function() {
    var basePath = '';
    var messages = {
        saveError: 'Hubo un error al guardar los datos en el servidor. Recarga la página e inténtalo de nuevo',
        saveSusccess: 'Datos guardados exitosamente',
        getError: 'Hubo un error al obtener los datos del servidor. Pruebe con recargar la página',
        
        //textos al eliminar un objeto
        deleteMsg: '¿Está seguro de eliminar el objeto seleccionado?',
        deleteTitle: 'Eliminar Objeto'
    };
    var newPath = 'nuevo';
    
    this.setBasePath = function(path) {
        basePath = path;
        return this;
    };
    
    this.setMessages = function(msg) {
        messages.saveError = (msg.saveError) ? msg.saveError : messages.saveError;
        messages.saveSusccess = (msg.saveSusccess) ? msg.saveSusccess : messages.saveSusccess;
        messages.getError = (msg.getError) ? msg.getError : messages.getError;
        messages.deleteMsg = (msg.deleteMsg) ? msg.deleteMsg : messages.deleteMsg;
        messages.deleteTitle = (msg.deleteTitle) ? msg.deleteTitle : messages.deleteTitle;
        
        return this;
    };
    
    this.setNewPath = function(val) {
        newPath = val;
    };
    
    this.$get = function() {
        return {
            basePath: basePath,
            messages: messages,
            newPath: newPath
        };
    };
});;angular.module('adminPanel.crud').service('CrudService', [
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
        var Form = function(scope, Resource, apLoadName, file) {
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
                var request = Resource.save(object);
                
                //Se hace el request para guardar el objeto
                request.$promise.then(function(responseSuccess) {
                    //Si no hay archivos se sigue el curso actual
                    if(file === null) {
                        scope.$emit('apLoad:finish', apLoadName, {
                            message: CrudConfig.messages.saveSusccess,
                            type: 'success'
                        });
                        if(callbackSuccess) {
                            callbackSuccess(responseSuccess);
                        }
                    } else {
                        var requestFile = Resource[file.prop](responseSuccess.data);
                        requestFile.$promise.then(function(fileResponseSuccess) {
                            scope.$emit('apLoad:finish', apLoadName, {
                                message: CrudConfig.messages.saveSusccess,
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
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.saveError,
                        type: 'error'
                    });
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
            var form = new Form(scope, resource.$resource, apLoadName, resource.file);
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
;/**
 * @description Servicio de normalizacion de objetos.
 * 
 * @type Service
 */
angular.module('adminPanel.crud').service('NormalizeService', [
    function () {
        function camelize(str) {
            return str.replace(/(\_\w)/g, function(m){
                return m[1].toUpperCase();
            });
        }
        
        /**
         * @description Copia el objeto y lo normaliza, es decir mira las propiedades del objeto, y si es otro objeto
         * y tiene un id, deja como valor de la propiedad el id del objeto.
         * 
         * @param {Object} obj Objeto a normalizar
         * @returns {Object} Copia del objeto normalizado
         */
        this.normalize = function (obj) {
            var object = angular.copy(obj);
            for(var key in object) {
                if(key.charAt(0) === '$') {
                    delete object[key];
                    continue;
                }

//                var name = camelize(key);
                var name = key;

                if('object' === typeof(object[key]) && object[key] !== null) {
                    if('undefined' !== typeof(object[key].id)) {
                        object[name] = object[key].id;
                    } else {
                        object[name] = this.normalize(object[key]);
                    }
                } else {
                    object[name] = object[key];
                }
                if(key != name) {
                    delete object[key];
                }
            }
            return object;
        };
    }
]);;function navigationController($scope, $timeout, AdminPanelConfig, $location) {
    $scope.items = AdminPanelConfig.navigationItems;
    $scope.elem = $('navigation');
    $scope.currentRoute = null;
    $scope.baseIndex = null;
    
    function changeRoute(route) {
        $scope.currentRoute = route;
        var index = 0;
        for(var item in $scope.items) {
            if($scope.items[item].link === '#') {
                //el elemento tiene items anidados
                for(var nestedItem in $scope.items[item].items) {
                    var r = $scope.items[item].items[nestedItem];
                    if(r.slice(r.indexOf('/')) === route) {
                        $scope.baseIndex = index;
                        break;
                    }
                }
            } else {
                //el elemento no tiene items anidados por lo tanto se checkea la ruta
                var routeAux = $scope.items[item].link.slice($scope.items[item].link.indexOf('/'));
                if(routeAux === route) {
                    $scope.baseIndex = index;
                    break;
                }
            }
            index++;
        }
    }
    
    $scope.checkRoute = function(route) {
        var routeAux = route.slice(route.indexOf('/'));
        return {
            'is-active': routeAux === $scope.currentRoute
        };
    };
    
    this.$onInit = function() {
        //En este caso $timeout es usado para ejecutar una funcion despues de que termine el ciclo $digest actual
        //cuando se termino de linkear todos los elementos de ngRepeat
        //https://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished
        $timeout(function() {
            $scope.elem = $('navigation');
            $scope.accordion = new Foundation.AccordionMenu($scope.elem);
            $scope.elem.find('> .menu').addClass('visible');
        });
        
        changeRoute($location.path());
    };

    this.$onDestroy = function() {
        if($scope.accordion) {
            $scope.accordion.$element.foundation('_destroy');
        }
    };
    
    $scope.$on('$routeChangeSuccess', function(e, route) {
        changeRoute($location.path());
    });
}

angular.module('adminPanel.navigation', [
    'adminPanel'
]).component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', '$location', navigationController]
});;/*angular.module('adminPanel').directive('hamburger', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'AE',
            link: function (scope, elem, attr) {
                elem.addClass('hambruger-wrapper');
                
                var toggleClickElement = function() {
                    $('#hamburger-icon').toggleClass('active');
                    return false;
                };
                
                elem.on('click', toggleClickElement);
                $(document).on('closed.zf.offcanvas', toggleClickElement);
                
                scope.$on('$destroy', function() {
                    $(document).off('closed.zf.offcanvas', toggleClickElement);
                    elem.off('click', toggleClickElement);
                });
            },
            templateUrl: 'directives/hamburger/hamburger.template.html'
        };
    }
]);*/;function topBarController($scope, AuthenticationService, $location) {
    $scope.clickBtn = function() {
        AuthenticationService.logout();
        $location.path('/login');
    };
    
    this.$postLink = function() {
        $('top-bar').foundation();
    };
}

angular.module('adminPanel.topBar', [
    'adminPanel.authentication'
]).component('topBar', {
    templateUrl: 'components/top-bar/top-bar.template.html',
    controller: ['$scope', 'AuthenticationService', '$location', topBarController]
}).directive('hamburger', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'AE',
            link: function (scope, elem, attr) {
                elem.addClass('hambruger-wrapper');
                
                var toggleClickElement = function(e) {
                    $('#offCanvas').foundation('toggle');
                    return false;
                };
                
                var removeActiveClass = function() {
                    $('#hamburger-icon').removeClass('active');
                    return false;
                };
                
                var addActiveClass = function() {
                    $('#hamburger-icon').addClass('active');
                    return false;
                };
                
                elem.on('click', toggleClickElement);
                $(document).on('closed.zf.offcanvas', removeActiveClass);
                $(document).on('opened.zf.offcanvas', addActiveClass);
                
                scope.$on('$destroy', function() {
                    $(document).off('closed.zf.offcanvas', removeActiveClass);
                    $(document).off('opened.zf.offcanvas', addActiveClass);
                    elem.off('click', toggleClickElement);
                });
            },
            templateUrl: 'components/top-bar/hamburger/hamburger.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apAccordion',[
    '$timeout',
    function($timeout){
        return {
            require: 'ngModel',
            restrict: 'AE',
            transclude: true,
            scope: {
                allowAllClosed: '=',
                multiExpand: '=',
                addButtonText: '@?',
                name: '@?'
            },
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-accordion');

                scope.accordion = new Foundation.Accordion(elem.find('.accordion'), {
                    'data-multi-expand':scope.multiExpand,
                    'data-allow-all-closed':scope.allowAllClosed
                });

                scope.addElement = function() {
                    var obj = {};
                    var name = (scope.name) ? scope.name : 'default';
                    scope.$emit('ap.accordion.add', obj, name);
                    if(!angular.isUndefined(ngModel.$modelValue)) {
                        ngModel.$modelValue.push(obj);
                    }
                };

                scope.removeElement = function(object) {
                    scope.$emit('ap.accordion.remove', object);
                    var array = ngModel.$modelValue;
                    var index = array.indexOf(object);
                    if (index > -1) {
                        array.splice(index, 1);
                    }
                };
                
                //Init al finalizar el ciclo digest actual
                $timeout(function() {
                    if(angular.isUndefined(ngModel.$modelValue)) {
                        scope.$apply(function(){
                            ngModel.$setViewValue([]);
                        });
                    }
                });
            },
            controller: ['$scope', function($scope) {
                this.toggleTab = function(tab) {
                    $scope.accordion.$element.foundation('toggle', tab);
                };

                this.removeElement = function(object) {
                    $scope.removeElement(object);
                };

                this.reInitComponent = function() {
                    $scope.accordion.$element.foundation('up', $scope.accordion.$tabs.find('.accordion-content'));
                    Foundation.reInit($scope.accordion.$element);
                };
            }],
            templateUrl: 'directives/accordion/accordion.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apAccordionItem', function(){
    return {
        require: ['^^apAccordion', 'ngModel'],
        restrict: 'AE',
        transclude: true,
        scope: {
            itemDefaultTitle: '@?',
            deleteButton: '=?'
        },
        link: function(scope, elem, attr, controller) {
            scope.title = '';
            attr.$set('dataAccordionItem', '');
            elem.addClass('accordion-item is-active');
            controller[0].reInitComponent(); /* Parent controller */
            
            scope.deleteElement = function() {
                controller[0].removeElement(controller[1].$modelValue);
            };
            
            scope.toggleTab = function() {
                controller[0].toggleTab(elem.find('.accordion-content'));
            };
            
            if(scope.itemDefaultTitle !== undefined) {
                scope.title = scope.itemDefaultTitle;
            }
            
        },
        controller: ['$scope', function ($scope) {
                this.changeTitleName = function(val) {
                    $scope.title = val;
                };
        }],
        templateUrl: 'directives/accordion/accordionItem.template.html'
    };
});
;angular.module('adminPanel').directive('apAccordionItemTitle', ['$parse',function($parse){
    return {
        require: ['^^apAccordionItem', 'ngModel'],
        restrict: 'A',
        link: function(scope, elem, attr, controller) {
            scope.objectValues = $parse(attr.apAccordionItemTitle)(scope);

            scope.$watch(function() {
                return controller[1].$modelValue;
            }, function (val) {
                if(!val) return;
                var title = '';
                if(val instanceof Date) { 
                    title = val.toLocaleString();
                } else {
                    if(scope.objectValues instanceof Array) {
                        title = '';
                        for(var i = 0; i < scope.objectValues.length; i++) {
                            title += val[scope.objectValues[i]] + ', ';
                        }
                        title = title.replace(/,\s*$/, "");
                    } else {
                        title = val;
                    }
                }
                controller[0].changeTitleName(title);
            });
        }
    };
}]);;//Mirar el componente cars de foundation

//Ver de sacar el isolated scope asi se puede usar scope broadcast en este elemento

angular.module('adminPanel').directive('apBox', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'AE',
            priority: 100,
//        terminal: true,
            transclude: true,
            scope: {
                title: '@',
                init: '&?'
            },
            compile: function (elem, attr) {
                elem.addClass('ap-box');

                //Link function
                return function (scope, elem, attr) {
                    //El boton de cierre del box se muestra solamente si tiene seteado 
                    //el atributo name, el cual debe ser el nombre del evento que lo muestra.
                    scope.closeButton = (typeof (attr.name) !== 'undefined');
                    scope.message = null;
                    scope.elem = elem;
//                    scope.isHide = false;
                    scope.isHide = scope.closeButton;

                    //Ejecutada al ingresar el mouse al elemento. Aplica la clase para iluminar el box
                    function onMouseEnter() {
                        scope.elem.removeClass('no-visible');
                        $rootScope.$broadcast('box.directive.mouseenter', scope.elem);
                    }

                    //Funcion ejecutada al ingresar el mouse a otro box en la pantalla
                    function onMouseEnterInOtherBox(e, elem) {
                        if (scope.elem === elem) {
                            return;
                        }
                        scope.elem.addClass('no-visible');
                    }

                    //Funcion que se usa para mostrar el box al lanzar determinado 
                    //evento con el nombre determinado para el box
                    function showOnEvent(e, name) {
                        if (attr.name === name) {
                            scope.isHide = false;
                        }
                    }

                    //Funcion ejecutada para cerrar el box
                    scope.close = function () {
                        scope.isHide = true;
                    };

                    elem.on('mouseenter', onMouseEnter);
                    var onMouseEnterInOtherBoxDestructor = scope.$on('box.directive.mouseenter', onMouseEnterInOtherBox);
                    var showOnEventDestructor = scope.$on('apBox:show', showOnEvent);
                    var destroyEventDestructor = scope.$on('$destroy', function () {
                        //Unbind events
                        elem.off('mouseenter', onMouseEnter);
                        onMouseEnterInOtherBoxDestructor();
                        showOnEventDestructor();
                        destroyEventDestructor();
                    });

                    if (scope.init) {
                        scope.init();
                    }
                };
            },
            templateUrl: 'directives/box/box.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apChoice', [
    '$timeout', '$rootScope', '$q', '$injector',
    function ($timeout, $rootScope, $q, $injector) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                items: '='
            },
            link: function (scope, elem, attr, ngModel) {
                
            },
            templateUrl: 'directives/choice/choice.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apDatePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datepicker');
            scope.date = null;
            var options = {
                format: 'dd/mm/yyyy'
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                }
            });
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeDate(date) {
                
                //cambio hecho al terminar el ciclo $digest actual
                $timeout(function() {
                    scope.$apply(function(){
                        ngModel.$setViewValue(date);
                    });
                });
            }
            
            //Se inicializa el componente fdatepicker en la vista y se le asigna un eventListener para
            //detectar cuando se cambia la hora
            $(elem.find('.ap-date')).fdatepicker(options)
                    .on('changeDate', function(ev){
                scope.date = ev.date;
                scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                changeDate(scope.date);
            });
            
        },
        templateUrl: 'directives/datePicker/datePicker.template.html'
    };
}]);
;angular.module('adminPanel').directive('apDateTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datetimepicker');
            scope.hours = null;
            scope.minutes = null;
            scope.date = null;
            var options = {
                format: 'dd/mm/yyyy'
//                pickTime: true,
//                initialDate: scope.date
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    if(isNaN(date)) return; //la fecha no es valida
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeDateTime(date, hours, minutes) {
                var h = (angular.isUndefined(hours) || hours === null) ? 
                        ((scope.hours !== null) ? scope.hours : 0) : hours;
                var m = (angular.isUndefined(minutes) || minutes === null) ?  
                        ((scope.minutes !== null) ? scope.minutes : 0) : minutes;
                date.setSeconds(0);
                date.setHours(h);
                date.setMinutes(m);
                
                //cambio hecho al terminar el ciclo $digest actual
                $timeout(function() {
                    scope.$apply(function(){
                        ngModel.$setViewValue(date);
                    });
                });
            }
            
            //Se inicializa el componente fdatepicker en la vista y se le asigna un eventListener para
            //detectar cuando se cambia la hora
            $(elem.find('.ap-date')).fdatepicker(options)
                    .on('changeDate', function(ev){
                scope.date = ev.date;
                scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                changeDateTime(scope.date);
            });
            
            //Funcion que se ejecuta al cambiar de hora en la vista
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
            
            //Funcion que se ejecuta al cambiar de minuto en la vista
            scope.changeMinute = function() {
                if(scope.minutes < 0) {
                    scope.minutes = 0;
                }
                if(scope.minutes > 59) {
                    scope.minutes = 59;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
        },
        templateUrl: 'directives/dateTimePicker/dateTimePicker.template.html'
    };
}]);
;angular.module('adminPanel').directive('apFileSaver', [
    '$http', 'CrudConfig',
    function ($http, CrudConfig) {
        return {
            restrict: 'AE',
            scope: {
                url: '@',
                params: '<',
                type: '@',
                value: '@'
            },
            link: function (scope, elem) {
                elem.addClass('ap-file-saver');
                
                var self= this;
                self.button = elem.find('button');
                //Establecemos reportes
                scope.buttonName = scope.value || 'Generar Reporte';
                scope.loading = false;
                
                function doRequest() {
                    scope.loading = true;
                    return $http({
                        url: CrudConfig.basePath + scope.url,
                        method: 'GET',
                        headers: {
                            'Content-type': scope.type
                        },
                        responseType: 'arraybuffer',
                        params: scope.params
                    }).then(function (r) {
                        console.log('resposeuta');
                        console.log(r.data);
                        console.log(r.headers);
                        console.log(r.status);

                        var fileName = r.headers('Content-Disposition').split('filename').pop().replace(/['"=]+/g, '');

                        var blob = new Blob([r.data], {
                            type: scope.type + ";charset=utf-8"
                        });

                        console.log('file', blob);
                        saveAs(blob, fileName);

                    }).finally(function() {
                        scope.loading = false;
                    });
                }

                function clickElem() {
                    doRequest();
                }

                self.button.on('click', clickElem);

                scope.$on('$destroy', function () {
                    self.button.off('click', clickElem);
                });
            },
            templateUrl: 'directives/fileSaver/fileSaver.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apFilters',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            transclude: true,
            link: function(scope, elem, attr) {
                var accordionElem = null;

                $timeout(function() {
                    
                    accordionElem = elem.find('.accordion.filtros');
                    console.log('elem',accordionElem);
                    accordionElem.foundation();
                });
                
                scope.$on('$destroy', function() {
                    if(accordionElem !== null) {
                        accordionElem.foundation('_destroy');
                    }
                });
            },
            templateUrl: 'directives/filter/filter.template.html'
        };
    }
]);;angular.module('adminPanel').directive('fieldErrorMessages', [
    function() {
        return {
            restrict: 'E',
            scope: {
                errors: '='
            },
            link: function(scope, elem) {
                elem.addClass('form-error');
                console.log('fieldErrorMessages',scope);
            },
            templateUrl: 'directives/form/fieldErrorMessages.template.html'
        };
    }
]);

;angular.module('adminPanel').directive('formValidation', [
    '$parse','$compile',
    function($parse,$compile) {
        return {
            require: 'form',
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr, formCtrl) {
                console.log('formCtrl',formCtrl);
                //Definimos las validaciones
                var required = function(fieldCtrl, expression) {
                    if(angular.isUndefined(expression)) {
                        expression = true;
                    }
                    return function(modelValue, viewValue) {
                        return !expression || !fieldCtrl.$isEmpty(viewValue);
                    };
                };
                var number = function(ctrl) {
                    
                };
                
                var validators = {
                    required: required
                };
                
                
                //Seteamos las validaciones
                var validations = $parse(attr.formValidation)(scope);
                scope.validations = {};
                for(var field in validations) {
                    var fieldCtrl = formCtrl[field];
                    var fieldDOMElem = fieldCtrl.$$element;
                    console.log(fieldCtrl);
                    var messages = {};
                    for(var validation in validations[field]) {
                        var validator = validations[field][validation];
                        fieldCtrl.$validators[validation] = validators[validation](fieldCtrl, validator.expression);
                        messages[validation] = validator.message;
                    }
                    scope.validations[field] = {
                        errors: fieldCtrl.$error,
                        messages: messages
                    };
                    var fieldErrorMessagesDirective = angular.element('<field-error-messages errors="validations.'+field+'.errors" messages="validations.'+field+'.messages">');
                    $compile(fieldErrorMessagesDirective)(scope);
                    fieldDOMElem.after(fieldErrorMessagesDirective);
                }
                console.log(scope.validations);
            }
        };
    }
]);;/**
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
                    console.log('inputErrors', val);
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
                    console.log('val', val);
                    $animate[val ? 'addClass' : 'removeClass'](elem, 'is-invalid-label');
                    $animate[val ? 'addClass' : 'removeClass'](scope.inputElem, 'is-invalid-input');
                    $animate[val ? 'addClass' : 'removeClass'](scope.fieldErrorMsgDirective, 'is-visible');
                });
            }
        };
    }
]);
;angular.module('adminPanel').directive('apImageLoader', [
    function(){
        return {
            require: 'ngModel',
            restrict: 'E',
            scope: true,
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-image-loader row columns');
                scope.image = {
                    path: null,
                    name: null
                };
                var imageFileMimeType = /^image\/[a-z]*/g;
                
                function onLoadFile(event) {
                    var file = event.target.files[0];
                    if(!file || !imageFileMimeType.test(file.type)) return;
                    
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        scope.$apply(function() {
                            var result = e.target.result;
                            scope.image.path = result;
                            scope.image.name = file.name;
                            ngModel.$setViewValue(file);
                        });
                    };
                    reader.readAsDataURL(file);
                }
                
                elem.find('input[type="file"]').bind('change', onLoadFile);

                scope.loadImage = function() {
                    
                };
                
                //evento que escucha el model para hacer el bindeo de las variables
                var modelWatcher = scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (modelValue) {
                    console.log('modelValue',modelValue);
                });
                
                //Desacoplamos los eventos al eliminar el objeto
                scope.$on('$destroy', function() {
                    elem.find('input[type="file"]').unbind('change', onLoadFile);
                    modelWatcher();
                });
                
            },
            templateUrl: 'directives/imageLoader/imageLoader.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apInfo', [
    '$timeout',
    function($timeout){
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                var self = this;
                
                //el boton se inicializa como cerrado
                //false = cerrado | true = abierto
                scope.currentState = false;
                scope.apInfoOnTableController = null;
                
                //se usa la funcion timeout para que se ejectue ultimo esta funcion, cuando ya todos los objetos hayan sido compilados
                self.init = function() {
                    $timeout(function() {
                        //ubicamos el elemento abajo del parent en otra fila de la tabla
                        var trParent = elem.closest('tr');
                        var colspan = trParent.find('td').length - 1;

                        //ubicamos el elemento que queremos mover
                        var apInfoOnTableDirective = trParent.find('[ap-info-on-table=""]');
                        
                        scope.apInfoOnTableController = apInfoOnTableDirective.controller('apInfoOnTable');
                        scope.apInfoOnTableController.setColspan(colspan);

                        //envolvemos el container en un tr y lo agregamos despues del tr actual, quedando como un elemento mas de la tabla
                        trParent.after(angular.element('<tr>')
                                .append(apInfoOnTableDirective));
                    });
                    
                };
                
                self.toggleButton = function() {
                    scope.currentState = !scope.currentState;
                    elem.find('.ap-info')[scope.currentState ? 'addClass' : 'removeClass']('open');
                    scope.apInfoOnTableController.toggleElem();
                };
                
                elem.on('click', self.toggleButton);
                
                scope.$on('$destroy', function() {
                    elem.off('click', self.toggleButton);
                });
                
                self.init();
            },
            template: '<div class="ap-info"></div>'
        };
    }
]);
;angular.module('adminPanel').directive('apInfoOnTable', [
    function(){
        return {
            restrict: 'A',
            priority: 1000,
            transclude: true,
            link: function(scope, elem, attr) {
                //false = cerrado | true = abierto
                scope.currentState = false;
                
                elem.addClass('no-padding');
                
                //buscamos el contenedor del elemento 
                scope.container = elem.find('.ap-info-on-table');
                scope.container.hide();
                
                scope.toggleElem = function() {
                    scope.currentState = !scope.currentState;
                    scope.container[scope.currentState ? 'slideDown' : 'slideUp'](500, function() {
                        scope.$apply();
                    });
                };
            },
            controller: [
                '$scope','$element',
                function($scope,$element) {
                    this.toggleElem = function() {
                        $scope.toggleElem();
                    };
                    
                    this.setColspan = function(colspan) {
                        $element.attr('colspan',colspan);
                    };
                    
                }
            ],
            template: '<div class="ap-info-on-table"><div ng-if="currentState"><div ng-transclude></div></div></div>'
        };
    }
]);
;angular.module('adminPanel').directive('apLoad', [
    '$animate', '$compile', 
    function($animate, $compile){
    return {
        restrict: 'A',
        priority: 50,
        scope: {
            apLoad: '=?'
        },
        link: function(scope, elem, attr) {
            //controla que no haya una directiva ap-load en sus elementos hijos
            var name = attr.apLoad;
            if (elem.find("[ap-load='" + name + "']").length !== 0) {
                return;
            }

            scope.name = (name) ? name : 'default';
            elem.addClass('ap-load');
            var img = angular.element('<ap-loading-img>');
            elem.append(img);
            $compile(img)(scope);

            scope.show = function () {
                $animate.removeClass(elem, 'loading');
            };

            scope.hide = function () {
                $animate.addClass(elem, 'loading');
            };

            // generamos un watcher para porder mantener el control de la vista
            scope.$watch(function () {
                return scope.apLoad;
            }, function(val) {
                if (val) {
                    scope.hide();
                } else {
                    scope.show();
                }
            });

            var startEventDestructor = scope.$on('apLoad:start', function(e) {
                e.stopPropagation();
                scope.hide();
            });
            var finishEventDestructor = scope.$on('apLoad:finish', function(e) {
                e.stopPropagation();
                scope.show();
            });
            
            var destroyEventDestructor = scope.$on('$destroy', function () {
                startEventDestructor();
                finishEventDestructor();
                destroyEventDestructor();
            });
        },
        controller: ['$scope',function($scope) {
            
            this.getName = function() {
                console.log('getName',$scope.name);  
                return $scope.name;
            };
            
            this.show = function() {
                $scope.show();
            };
            
            this.hide = function() {
                $scope.hide();
            };
            
        }]
    };
}
]);
;angular.module('adminPanel').directive('apLoadingImg', ['AdminPanelConfig', 
    function(AdminPanelConfig){
        return {
            restrict: 'AE',
            priority: 60,
            link: function(scope, elem) {
                elem.addClass('ap-load-image');
                scope.path = AdminPanelConfig.imgLoadingRsc;
            },
            templateUrl: 'directives/load/loadingImg.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apMessage', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            require: '?^apMessageContainer',
            scope: {
                message: '='
            },
            link: function(scope, elem, attr, apMessageContainerCtrl) {
                scope.remove = function() {
                    if(apMessageContainerCtrl) {
                        apMessageContainerCtrl.removeMessage(scope.message);
                    }
                };
                
                $timeout(function() {
                   scope.remove();
                }, 5000);
            },
            templateUrl: 'directives/messages/message.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apMessageContainer', [
    function() {
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                elem.addClass('row column expanded ap-message-container');
                scope.messageList = [];
                
                scope.addMessage = function(message) {
                    scope.messageList.unshift(message);
                    return this;
                };
                
                scope.removeMessage = function(message) {
                    var index = scope.messageList.indexOf(message);
                    if(index >= 0) {
                        scope.messageList.splice(index,1);
                    }
                    return this;
                };
                
                var deresgisterEventAdd = scope.$on('ap-message:create',function(e, message) {
                    scope.addMessage(message);
                });
                
                var deregisterEventDestroy = scope.$on('$destroy',function() {
                    deresgisterEventAdd();
                    deregisterEventDestroy();
                });
            },
            controller: [
                '$scope',
                function($scope) {
                    this.removeMessage = function(message) {
                        $scope.removeMessage(message);
                    };
                }
            ],
            templateUrl: 'directives/messages/messagesContainer.template.html'
        };
    }
]);;/**
 * Al evento 'ap-confirm-modal:show' se deben pasar 3 valores:
 * {
 *   title: titulo del modal,
 *   text: texto a mostrar,
 *   fn: function a realizar en caso de ser verdadera
 * }
 */

angular.module('adminPanel').directive('apConfirmModal', [ 
    '$timeout',
    function($timeout) {
        return {
            restrict: 'AE',
            priority: 60,
            link: function(scope, elem) {
                var htmlElem = null;
                var fnToRealize = null;
                
                //init
                $timeout(function() {
                    htmlElem = new Foundation.Reveal(elem.find('.reveal'));
                    console.log('htmlElem', htmlElem);
                });
                
                scope.yes = function() {
                    if(fnToRealize !== null) {
                        fnToRealize();
                    }
                    htmlElem.$element.foundation('close');
                };
                
                scope.no = function() {
                    htmlElem.$element.foundation('close');
                };
                
                scope.$on('ap-confirm-modal:show', function(e, data) {
                    scope.title = data.title;
                    scope.text = data.text;
                    
                    fnToRealize = angular.isFunction(data.fn) ? data.fn : null;
                    
                    $timeout(function() {
                        htmlElem.$element.foundation('open');
                    });
                });
            },
            templateUrl: 'directives/modals/confirm/confirmModal.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('msfCoordenadas', [
    '$timeout',
    function($timeout) {
    return {
        require: 'ngModel',
        restrict: 'E',
        link: function(scope, elem, attr, ngModel) {
            scope.coordenadas = '';
            scope.error = false;
            
            //init function
            $timeout(function() {
                if(angular.isUndefined(ngModel.$modelValue)) {
                    ngModel.$modelValue = {
                        latitud: null,
                        longitud: null
                    };
                    console.log('ngModel.$modelValue',ngModel.$modelValue);
                }
                scope.model = {
                    latitud: angular.copy(ngModel.$modelValue.latitud),
                    longitud: angular.copy(ngModel.$modelValue.longitud)
                };
            });
            
            //actualizacion externa
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    scope.model = {
                        latitud: angular.copy(ngModel.$modelValue.latitud),
                        longitud: angular.copy(ngModel.$modelValue.longitud)
                    };
                }
            });
            
            scope.cambioCoordeandas = function() {
                var latitud = false, longitud = false;
                scope.error = false;
                
                //validacion
                var latRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var lngRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var splits = [',', ':', ' ', '.'];
                
                for(var i = 0; i < splits.length; i++) {
                    var arr = scope.coordenadas.replace(/\s+/g, '').split(splits[i]);
                    if (arr.length === 2) {
                        latitud = parseFloat( arr[0].replace(',', '.').match(latRegex) );
                        longitud = parseFloat( arr[1].replace(',', '.').match(lngRegex) );
                    } else if (arr.length === 4) {
                        latitud = parseFloat( (arr[0] + '.' + arr[1]).match(latRegex) );
                        longitud = parseFloat( (arr[2] + '.' + arr[3]).match(lngRegex) );
                    }
                }
                if(!latitud || !longitud //||
//                        latitud < -31.99 || latitud > -31 ||
//                        longitud < -61.99 || longitud > -60.3
                    ){
                    scope.model.latitud = '';
                    scope.model.longitud = '';
                    scope.error = true;
                    return;
                }
                scope.model.latitud = latitud;
                scope.model.longitud = longitud;
                ngModel.$setViewValue({
                    latitud: latitud,
                    longitud: longitud
                });
                
                scope.$emit('msfCoordenadas:change', this);
            };
        },
        templateUrl: 'directives/msfCoordenadas/msfCoordenadas.template.html'
    };
}]);
;angular.module('adminPanel').directive('apPagination', [
    'AdminPanelConfig','$location',
    function(AdminPanelConfig,$location){
        return {
            restrict: 'AE',
            priority: 50,
            link: function(scope, elem, attr) {
                var Pagination = function(showPagesCount) {
                    this.currentPage = 1;
                    this.pageCount = 10;
                    this.pages = [];
                    this.activeLastFirst = false;
                    this.enableNextPage = false;
                    this.enablePreviousPage = false;
                    this.enableFirstPage = false;
                    this.enableLastPage = false;
                    this.bottomPage = 1;
                    this.topPage = showPagesCount;

                    var generatePages = function(first, last) {
                        var ret = [];
                        for(var i = first; i <= last; i++) {
                            ret.push(i);
                        }
                        return ret;
                    };
                    
                    this.rePaginate = function() {
                        var margin = Math.floor(showPagesCount / 2);
                        var generate = !((this.bottomPage === 1 && this.currentPage <= margin) ||
                                (this.topPage === this.pageCount && this.currentPage >= this.pageCount - margin));
                        if(generate) {
                            if(this.currentPage - margin < 1) {
                                this.bottomPage = 1;
                                this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                            } else if(this.currentPage + margin > this.pageCount) {
                                this.topPage = this.pageCount;
                                this.bottomPage = this.activeLastFirst ? this.pageCount - showPagesCount + 1 : 1;
                            } else {
                                this.topPage = this.currentPage + margin;
                                this.bottomPage = this.currentPage - margin;
                            }
                            this.pages = generatePages(this.bottomPage, this.topPage);
                        }
                    };

                    this.changePage = function(page) {
                        $location.search('page', page);
                        if(this.currentPage === page) return;
                        scope.$emit('pagination:changepage', page);
                        this.currentPage = page;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enablePreviousPage = (this.currentPage > 1);
                        if(this.activeLastFirst) {
                            this.enableFirstPage = (this.currentPage > 1);
                            this.enableLastPage = (this.currentPage < this.pageCount);
                        }

                        this.rePaginate();
                    };

                    this.nextPage = function() {
                        if(page === this.pageCount) return;
                        var page = this.currentPage + 1;
                        this.changePage(page);
                    };

                    this.previousPage = function() {
                        if(page === 1) return;
                        var page = this.currentPage - 1;
                        this.changePage(page);
                    };

                    this.init = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.activeLastFirst = (this.pageCount > showPagesCount);
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.bottomPage = 1;
                        this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                        this.pages = generatePages(this.bottomPage, this.topPage);
                    };
                    
                    this.reInit = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.rePaginate();
                    };
                };
                scope.paginationInit = false;
                scope.pagination = new Pagination(AdminPanelConfig.pagination);
                
                scope.$on('pagination:paginate', function(e, data) {
                    if(scope.paginationInit) {
                        scope.pagination.reInit(data);
                    } else {
                        scope.paginationInit = true;
                        scope.pagination.init(data);
                    }
                });
            },
            templateUrl: 'directives/pagination/pagination.template.html'
        };
    }
]);

;/**
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
 */
angular.module('adminPanel').directive('apSelect', [
    '$timeout', '$rootScope', '$q', '$injector',
    function ($timeout, $rootScope, $q, $injector) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                resource: '@',
                queryParams: '=?',
                method: '@?',
                requestParam: '=?',
                properties: '='
            },
            link: function (scope, elem, attr, ngModel) {
                elem.addClass('select-ap');
                
                var resource = null;
                //obtenemos el servicio para hacer las consultas con el servidor}
                if($injector.has(scope.resource)) {
                    var crudResource = $injector.get(scope.resource, 'apSelect');
                    resource = crudResource.$resource;
                }
                if(!resource) {
                    console.error('El recurso no esta definido');
                }
                
                
                //habilitamos el boton para agregar entidades
                scope.enableNewButton = !(angular.isUndefined(attr.new) || attr.new === null);
                
                //obtenemos el nombre del select dado el atributo name
                var name = angular.isUndefined(attr.name) ? 'default' : attr.name;
                
                //se definen las propiedades del objeto a mostrar.
                var objectProperties = angular.isString(scope.properies) ? scope.properties.split(',') : scope.properties;

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
                console.log('requestParam',scope.requestParam);

                var request = null;
                var preventClickButton = false;
                
                /**
                 * Funcion que convierte un objeto a un item de la lista segun las propiedades especificadas
                 * en la propiedad properties de la directiva
                 * 
                 * @param {Object} object | entidad serializada que se esta listando
                 * @returns {Object} | tiene dos propiedades, name: que es por la que se lista despues en la vista
                 * y object, que es el objeto el cual se está listando
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
                    
                    var search = angular.isUndefined(scope.requestParam) ? {} : scope.requestParam;
                    console.log('search',search);
                    
                    if(!all) {
                        for (var j = 0; j < queryParams.length; j++) {
                            search[queryParams[j]] = scope.input.model;
                        }
                    }
                    
                    
                    request = resource[defaultMethod](search);
                    
                    //seteamos en la vista que el request esta en proceso
                    scope.loading = true;
                    var promise = request.$promise.then(function(rSuccess) {
                        var max = (rSuccess.data && rSuccess.data.length > 6) ? 6 : rSuccess.data.length;
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
                    
                    console.log('cerrar lista');
                    
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
                    
                    console.log('abrir lista');
                    //se abre la lista
                    scope.lista.desplegado = true;
                    //si la lista interna esta vacia se hace el request sin parametros en la consulta
                    if (scope.lista.items.length === 0) {
                        doRequest(true);
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
                    
                    //si no se previene el evento, se despliega la lista
                    if(!preventClickButton) {
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
                
                /**
                 * Toma el evento antes del click, dado que el click se computa cuando el usuario suelta el raton
                 * Si la lista no esta desplegada, el curso es el de no prevenir el evento click, para que la lista
                 * se despliegue.
                 * Si la lista esta desplegada, el curso es el de prevenir el evento click, para que cuando el input
                 * pierda el foco, la lista se cierre, pero cuando el usuario suelte el raton no se dispare el evento
                 * click, lo que volvería a abrir la lista, lo cual NO es deseado.
                 */
                scope.onMousedownButton = function(e) {
                    console.log('onMousedownButton');
                    preventClickButton = scope.lista.desplegado;
                    
                    console.log('desplegado', preventClickButton);
                    
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
                    scope.itemSelected = item;
                    
                    //asignamos el id de la entidad al modelo
                    ngModel.$setViewValue(item.$$object);
                    
                    //emitimos un evento al seleccionar un item, con el item y el nombre del elemento que se selecciono
                    scope.$emit('ap-select:item-selected', name, item.$$object);
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
                scope.newObject = function (e) {
                    e.stopPropagation();
                    
                    $rootScope.$broadcast('apBox:show', attr.new);
                };
                
                //registramos los eventos
                elem.on('mousedown', '.dropdown-ap', onListClick);
                
                /**
                 * Watcher que chequea cualquier cambio en el modelo de la entidad, tanto externo como interno
                 * Cuando es externo, se se construye el objeto actual con base en la entidad a la que se esta listando
                 * en cambio, cuando se elige un item de la lista, se usa la propiedad object del item de la lista seleccionado
                 * para construir el objeto
                 */
                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (val) {
                    if (val) {
                        //verificamos si el objeto proviene de la lista o del modelo y seteamos el item actual
//                        itemSelected = (val.$$object) ? val : convertObjectToItemList(val);
                        

                        //seteamos el item actual
                        scope.itemSelected = convertObjectToItemList(val);
                        console.log('itemSelected',scope.itemSelected);
                        
                        //seteamos el estado actual del modelo 
                        scope.input.model = (scope.itemSelected === null) ? '' : scope.itemSelected.name;
                        scope.input.vacio = (scope.itemSelected === null);
                        console.log('scope.input',scope.input);
                    }
                });
                
                /**
                 * Liberamos los eventos que hayan sido agregados a los elementos
                 */
                var destroyEventOnDestroy = scope.$on('$destroy', function() {
                    elem.off('mousedown', '.dropdown-ap', onListClick);
                    destroyEventOnDestroy();
                });
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apSwitch', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                id: '@',
                title: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('row column');

                scope.$watch(function() {
                    return ngModel.$modelValue;
                }, function(val) {
                    if(val) {
                        var date = new Date(val);
                        scope.date = date;
                        $(elem.find('.ap-date')).fdatepicker('update', date);
                    }
                });
                
                scope.$watch('model', function(val) {
                    ngModel.$setViewValue(val);
                });
                
                //init
                $timeout(function(){
                    elem.foundation();
                });
            },
            templateUrl: 'directives/switch/switch.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-timepicker');
            scope.hours = null;
            scope.minutes = null;
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeTime(hours, minutes) {
                var h = (hours === null) ? 
                        ((scope.hours !== null) ? scope.hours : 0) : hours;
                var m = (minutes === null) ?  
                        ((scope.minutes !== null) ? scope.minutes : 0) : minutes;
                
                var date = new Date();
                date.setSeconds(0);
                date.setHours(h);
                date.setMinutes(m);
                
                //cambio hecho al terminar el ciclo $digest actual
                $timeout(function() {
                    scope.$apply(function(){
                        ngModel.$setViewValue(date);
                    });
                });
            }
            
            //Funcion que se ejecuta al cambiar de hora en la vista
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeTime(scope.hours, scope.minutes);
            };
            
            //Funcion que se ejecuta al cambiar de minuto en la vista
            scope.changeMinute = function() {
                if(scope.minutes < 0) {
                    scope.minutes = 0;
                }
                if(scope.minutes > 59) {
                    scope.minutes = 59;
                }
                changeTime(scope.hours, scope.minutes);
            };
        },
        templateUrl: 'directives/timePicker/timePicker.template.html'
    };
}]);
;angular.module('adminPanel').filter('highlight', ['$sce', function ($sce) {
    return function (text, phrase) {
        if (phrase) {
            text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
                    '<span class="highlighted">$1</span>');
        }
        return $sce.trustAsHtml(text);
    };
}]);
;angular.module('adminPanel').service('WindowResize', [
    'AdminPanelConfig','$rootScope', '$window', '$timeout',
    function(AdminPanelConfig,$rootScope,$window,$timeout) {
        //Pantalla actual
        var currentViewport = null;
        var windowMinSizes = AdminPanelConfig.windowMinSizes;

        //Primero vemos que tamaño tiene la pantalla al cargar la pagina
        var calcViewport = function (width) {
            var size = 'small';
            if (width > windowMinSizes.medium) {
                size = 'medium';
            }
            if (width > windowMinSizes.large) {
                size = 'large';
            }
            if (currentViewport !== size) {
                currentViewport = size;
                console.log('size',size);
                $rootScope.$broadcast('viewportChange', size);
            }
        };

        angular.element($window).on('resize', function () {
            calcViewport($window.innerWidth);
        });

        return {
            init: function () {
                //se pone el timeout para terminar el ciclo $digest
                $timeout(function () {
                    calcViewport($window.innerWidth);
                }, 100);
            },
            //al iniciar cada componente deberia llamar a este metodo para elegir el comportamiento segun 
            //la el tipo de pantalla del dispositivo
            getCurrentViweport: function () {
                return currentViewport;
            }
        };
    }
]);;angular.module('adminPanel').provider('AdminPanelConfig', function() {
    var imgLoadingRsc = '';
    var pagination = 11;
    var defaultFormMessages = {
        email: 'Este campo debe ser un email',
        max: 'Se excedió el numero máximo',
        maxlength: 'El campo tiene demasiados carácteres',
        min: 'No se alcanza el numero minimo de carácteres',
        minlength: 'El texto ingresado es muy corto',
        number: 'Este campo debe ser numérico',
        pattern: 'Este campo no cumple con el patrón especificado',
        required: 'Este campo es requerido',
        url: 'Este campo debe ser una url',
        date: 'Este campo debe ser unna fecha',
        datetimelocal: 'Este campo debe ser una fecha',
        time: 'Ingresa una hora válida',
        week: 'Ingresa una semana válida',
        month: 'El mes no es válido'
    };
    var navigationItems = {};
    
     var windowMinSizes = {
        medium: 640,
        large: 1024
    };
    
    this.setWindowMinSizes = function(val) {
        windowMinSizes = val;
    };
    
    /**
     * @param {String} path Ruta hacia el archivo de la imagen usada para carga
     */
    this.setImgLoadingIconPath = function (path) {
        imgLoadingRsc = path;
        return this;
    };
    
    /**
     * @param {Integer} pages Paginas por default al listar elementos de una entidad
     */
    this.setPagesPagination = function(pages) {
        pagination = pages;
        return this;
    };
    
    /**
     * @param {Object} msgs Objeto cuyas propiedades son los nombres de los validation tokens y los valores 
     * son los mensajes
     */
    this.setDefaultFormMessenges = function(msgs) {
        for(var key in msgs) {
            defaultFormMessages[key] = msgs[key];
        }
        return this;
    };
    
    /**
     * @param {type} items Objeto que contiene la conformacion del menu
     * var items = {
     *   'Item menu name': {
     *     link: 'link',
     *     items: {
     *       'Nested item menu':'link'
     *     }
     *   },
     *   ...
     * }
     */
    this.setNavigationItems = function(items) {
        navigationItems = angular.copy(items);
        for(var item in navigationItems) {
            navigationItems[item].link = (navigationItems[item].link) ? '#!' + navigationItems[item].link : '#';
            for(var nestedItem in navigationItems[item].items) {
                navigationItems[item].items[nestedItem] = '#!' + navigationItems[item].items[nestedItem];
            }
        }
        return this;
    };
    
    this.$get = [
        function () {
            return {
                imgLoadingRsc: imgLoadingRsc,
                pagination: pagination,
                defaultFormMessages: defaultFormMessages,
                navigationItems: navigationItems,
                windowMinSizes: windowMinSizes
            };
        }
    ];
});;angular.module('adminPanel').run(['$templateCache', function ($templateCache) {
  $templateCache.put("admin-panel.template.html",
    "<div ap-user><div class=wrapper-header><top-bar></top-bar></div><div class=off-canvas-wrapper><div class=\"off-canvas position-left reveal-for-large\" data-transition=overlap id=offCanvas data-off-canvas><navigation></navigation></div><div class=off-canvas-content data-off-canvas-content><div ap-message-container></div><div id=content class=\"row column expanded\"><div ng-view></div></div></div></div><ap-confirm-modal></ap-confirm-modal></div>");
  $templateCache.put("components/crud/directives/list/list.template.html",
    "<div ng-if=\"list.length !== 0\"><div ng-transclude></div><ap-pagination></ap-pagination></div><div ng-if=\"list.length === 0\" class=\"small-12 callout warning text-center\">{{noResultText}}</div>");
  $templateCache.put("components/crud/directives/list/listContainer.template.html",
    "<ap-box title={{title}}><div ng-if=newRoute class=\"row columns\"><a ng-href={{newRoute}} class=button>Nuevo</a></div><div ng-transclude=form></div><div ap-load><div class=small-12 ng-transclude=list></div></div></ap-box>");
  $templateCache.put("components/navigation/navigation.template.html",
    "<ul class=\"vertical menu\"><li ng-repeat=\"(name, item) in items\" ng-class=\"{'is-active': baseIndex === $index}\"><a href={{item.link}} ng-bind=name></a><ul ng-if=item.items class=\"vertical menu nested\"><li ng-repeat=\"(nestedItemName, nestedItemLink) in item.items\" ng-class=checkRoute(nestedItemLink)><a href={{nestedItemLink}} ng-bind=nestedItemName></a></li></ul></li></ul>");
  $templateCache.put("components/top-bar/hamburger/hamburger.template.html",
    "<div id=hamburger-icon><span class=\"line line-1\"></span><span class=\"line line-2\"></span><span class=\"line line-3\"></span></div>");
  $templateCache.put("components/top-bar/top-bar.template.html",
    "<div class=top-bar><div class=top-bar-left><div hamburger></div>Hola</div><div class=logout title=\"cerrar sesión\" ng-click=clickBtn()><i class=\"fa fa-sign-out\"></i></div></div>");
  $templateCache.put("directives/accordion/accordion.template.html",
    "<div ng-if=addButtonText class=\"row column\"><button type=button class=\"button secondary\" ng-click=addElement() ng-bind=addButtonText></button></div><div class=accordion ng-transclude></div>");
  $templateCache.put("directives/accordion/accordionItem.template.html",
    "<div class=accordion-top><button type=button class=accordion-title ng-click=toggleTab() ng-bind=title></button><div class=accordion-button><button type=button ng-if=deleteButton class=\"button alert\" ng-click=deleteElement()><i class=\"fa fa-remove\"></i></button></div></div><div class=accordion-content data-tab-content ng-transclude></div>");
  $templateCache.put("directives/box/box.template.html",
    "<div class=card ng-if=!isHide><button ng-if=closeButton class=close-button type=button ng-click=close()><span>&times;</span></button><div class=card-divider><h5 ng-bind=title></h5></div><div class=card-section><div ng-if=message class=callout ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\" ng-bind=message.message></div><div ng-transclude ap-load></div></div></div>");
  $templateCache.put("directives/choice/choice.template.html",
    "<div class=input-group><input class=input-group-field type=text ng-model=input.model ng-change=onChangeInput() ng-focus=onFocusInput() ng-blur=onBlurInput()><div class=input-group-button><button type=button class=\"button secondary\" ng-click=onClickButton() ng-mousedown=onMousedownButton($event)><span class=caret></span></button></div></div><div class=dropdown-ap ng-class=\"{'is-open':lista.desplegado}\"><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && lista.items.length > 0\" class=list-group><li ng-repeat=\"option in lista.items\" ng-bind-html=\"option.name | highlight:input.model\" ng-mousedown=\"onClickItemList($event, option)\" ng-class=\"{'active':option.$$object.id === itemSelected.$$object.id}\"></li></ul><ul ng-if=\"!loading && lista.items.length === 0\" class=list-group><li style=font-weight:700>No hay resultados</li></ul><ul ng-if=enableNewButton class=\"list-group new\"><li ng-mousedown=newObject($event)><span class=\"fa fa-plus\"></span><span>Nuevo</span></li></ul></div>");
  $templateCache.put("directives/datePicker/datePicker.template.html",
    "<div class=input-group><span class=\"input-group-label prefix\"><i class=\"fa fa-calendar\"></i></span><input class=\"input-group-field ap-date\" type=text readonly></div>");
  $templateCache.put("directives/dateTimePicker/dateTimePicker.template.html",
    "<div class=input-group><span class=\"input-group-label prefix\"><i class=\"fa fa-calendar\"></i></span><input class=\"input-group-field ap-date\" type=text readonly><span class=input-group-label>Hs</span><input class=input-group-field type=number style=width:60px ng-model=hours ng-change=changeHour()><span class=input-group-label>Min</span><input class=input-group-field type=number style=width:60px ng-model=minutes ng-change=changeMinute()></div>");
  $templateCache.put("directives/fileSaver/fileSaver.template.html",
    "<button class=button type=button><i ng-hide=loading class=\"fa fa-download\"></i><div ng-show=loading class=animation><div style=width:100%;height:100% class=lds-rolling><div></div></div></div><span class=text ng-bind=buttonName></span></button>");
  $templateCache.put("directives/filter/filter.template.html",
    "<ul class=\"accordion filtros\" data-accordion data-allow-all-closed=true><li class=accordion-item data-accordion-item><a href=# class=accordion-title>Filtros</a><div class=accordion-content data-tab-content ng-transclude></div></li></ul>");
  $templateCache.put("directives/form/fieldErrorMessages.template.html",
    "<div ng-repeat=\"error in errors\" ng-show=error.expresion ng-bind=error.message></div>");
  $templateCache.put("directives/imageLoader/imageLoader.template.html",
    "<div class=image-view><img ng-src={{image.path}} ng-click=loadImage()></div><div class=input-group><div class=input-group-button><label for=exampleFileUpload class=\"button file\"><i class=\"fa fa-file-image-o\"></i></label><input type=file id=exampleFileUpload class=show-for-sr accept=image/*></div><input class=input-group-field type=text readonly ng-value=image.name></div>");
  $templateCache.put("directives/load/load.template.html",
    "<div ng-show=loading class=ap-load-image><img ng-src={{path}}></div><div ng-hide=loading class=ap-load-content><div ng-if=message class=callout ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\" ng-bind=message.message></div><div></div></div>");
  $templateCache.put("directives/load/loadingImg.template.html",
    "<img ng-src={{path}}>");
  $templateCache.put("directives/messages/message.template.html",
    "<div class=ap-message ng-class=message.type><div ng-bind=message.message></div><button class=close-button type=button ng-click=remove()><span>&times;</span></button></div>");
  $templateCache.put("directives/messages/messagesContainer.template.html",
    "<div class=\"row expanded\"><div ng-repeat=\"message in messageList\" class=small-12 ap-message message=message></div></div>");
  $templateCache.put("directives/modals/confirm/confirmModal.template.html",
    "<div class=reveal><h1 ng-bind=title></h1><p class=lead ng-bind=text></p><div class=button-group><a class=button ng-click=yes()>Si</a><a class=button ng-click=no()>No</a></div><button class=close-button data-close aria-label=\"Close modal\" type=button><span aria-hidden=true>&times;</span></button></div>");
  $templateCache.put("directives/msfCoordenadas/msfCoordenadas.template.html",
    "<div class=\"row column\"><div class=\"callout secondary text-center\">Podés obtener los datos de<u><a href=https://www.santafe.gov.ar/idesf/servicios/generador-de-coordenadas/tramite.php target=_blank>acá</a></u></div></div><div class=\"row column\"><label ng-class=\"{'is-invalid-label':error}\"><input style=margin-bottom:3px type=text ng-class=\"{'is-invalid-input':error}\" ng-model=coordenadas ng-change=cambioCoordeandas()><span ng-class=\"{'is-visible':error}\" style=margin-top:7px class=form-error>El campo ingresado contiene errores.</span></label></div><div class=row><div class=\"columns small-12 large-6\"><label>Latitud <input type=text ng-value=model.latitud readonly></label></div><div class=\"columns small-12 large-6\"><label>Longitud <input type=text ng-value=model.longitud readonly></label></div></div>");
  $templateCache.put("directives/pagination/pagination.template.html",
    "<ul class=\"pagination text-center\" role=navigation ng-if=\"pagination.pages.length !== 0\"><li ng-if=pagination.activeLastFirst class=pagination-previous ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.changePage(1)></a></li><li ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.previousPage()>&lsaquo;</a><span ng-if=!pagination.enablePreviousPage>&lsaquo;</span></li><li ng-repeat=\"page in pagination.pages track by $index\" ng-class=\"{'current':page === pagination.currentPage}\"><a ng-if=\"page !== pagination.currentPage\" ng-bind=page ng-click=pagination.changePage(page)></a><span ng-if=\"page === pagination.currentPage\" ng-bind=page></span></li><li ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.nextPage()>&rsaquo;</a><span ng-if=!pagination.enableNextPage>&rsaquo;</span></li><li ng-if=pagination.activeLastFirst class=pagination-next ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.changePage(pagination.pageCount)></a></li></ul>");
  $templateCache.put("directives/select/select.template.html",
    "<div class=input-group><input class=input-group-field type=text ng-model=input.model ng-change=onChangeInput() ng-focus=onFocusInput() ng-blur=onBlurInput()><div class=input-group-button><button type=button class=\"button secondary\" ng-click=onClickButton() ng-mousedown=onMousedownButton($event)><span class=caret></span></button></div></div><div class=dropdown-ap ng-class=\"{'is-open':lista.desplegado}\"><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && lista.items.length > 0\" class=list-group><li ng-repeat=\"option in lista.items\" ng-bind-html=\"option.name | highlight:input.model\" ng-mousedown=\"onClickItemList($event, option)\" ng-class=\"{'active':option.$$object.id === itemSelected.$$object.id}\"></li></ul><ul ng-if=\"!loading && lista.items.length === 0\" class=list-group><li style=font-weight:700>No hay resultados</li></ul><ul ng-if=enableNewButton class=\"list-group new\"><li ng-mousedown=newObject($event)><span class=\"fa fa-plus\"></span><span>Nuevo</span></li></ul></div>");
  $templateCache.put("directives/switch/switch.template.html",
    "<label ng-bind=title></label><div class=switch><input class=switch-input id={{id}} type=checkbox ng-model=model><label class=switch-paddle for={{id}}></label></div>");
  $templateCache.put("directives/timePicker/timePicker.template.html",
    "<div class=input-group><span class=input-group-label>Hs</span><input class=input-group-field type=number ng-model=hours ng-change=changeHour()><span class=input-group-label>Min</span><input class=input-group-field type=number ng-model=minutes ng-change=changeMinute()></div>");
}]);
