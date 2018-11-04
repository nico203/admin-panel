angular.module('adminPanel', [
    'ngAnimate',
    'duScroll',
    'adminPanel.authentication',
    'adminPanel.crud',
    'adminPanel.topBar',
    'adminPanel.navigation',
    'adminPanel.filters',
    'adminPanel.utils'
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
    }
]);;angular.module('adminPanel.crud', [
    'adminPanel',
    'ngResource'
]);;angular.module('adminPanel.filters', []);;angular.module('adminPanel.utils', []);
;angular.module('adminPanel.crud').directive('apDelete',[
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
 * Controlador para filtros de tablas.
 */
angular.module('adminPanel.crud').factory('BasicFilterController', [
    '$location',
    function($location) {
        function BasicFilterController($scope) {
            var self = this;

            /**
             * @description Actualiza la ruta y emite un evento con los datos del formulario
             * 
             * @param transform Función que transforma los datos antes de aplicar el filtro (opcional)
             */
            self.filter = function(transform) {
                if (transform) {
                    transform($scope.filtros);
                }
                $location.search($scope.filtros);
                $scope.$emit('filter', angular.copy($scope.filtros));
            };
            
            /**
             * @description Limpia el formulario y emite un evento
             */
            self.clear = function() {
                $scope.filtros = {
                    exclusiveSearch: true
                };
                self.filter();
            };
            
            /**
             * @description Inicializa el controlador
             * 
             * @param transform Función que inicializa los datos del filtro (opcional)
             * @returns {BasicFilterController}
             */
            self.init = function(transform) {
                $scope.filtros = angular.isDefined($location.search()) ? $location.search() : {};
                $scope.filtros.exclusiveSearch = true;
                
                if (transform) {
                    transform($scope.filtros);
                }
                
                self.filter();
                return self;
            };
        }
        
        return BasicFilterController;
    }
]);;/**
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
                        self.$$crudFactory.createMessage(CrudConfig.messages.saveSuccess,'success');
                        self.reset();

                        return responseSuccess;
                    }, function(responseError) {
                        self.$$crudFactory.createMessage(CrudConfig.messages.saveError,'alert');

                        return $q.reject(responseError);
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
    'CrudFactory', 'CrudConfig', '$timeout','$q',
    function(CrudFactory, CrudConfig, $timeout, $q) {
        
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
                    self.$$crudFactory.createMessage(CrudConfig.messages.deleteSuccess,'success');
                    return self.list(self.listParams);
                }, function (responseError) {
                    self.$$crudFactory.createMessage(CrudConfig.messages.deleteError,'alert');
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

            var extrasPostTransformRequest = function(data) {
                return NormalizeService.normalize(transforms.request(data));
            };

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

                if (extra.method === 'POST') {
                    if (extra.transformRequest) {
                        extra.transformRequest.push(extrasPostTransformRequest);
                        extra.transformRequest.push($http.defaults.transformRequest[0]);
                    } else {
                        extra.transformRequest = [
                            extrasPostTransformRequest,
                            $http.defaults.transformRequest[0]
                        ];
                    }
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



;angular.module('adminPanel.crud').provider('CrudConfig', function() {
    var basePath = '';
    var messages = {
        saveError: 'Hubo un error al guardar los datos en el servidor. Recarga la página e inténtalo de nuevo',
        saveSuccess: 'Datos guardados exitosamente',
        getError: 'Hubo un error al obtener los datos del servidor. Pruebe con recargar la página',
        deleteError: 'Hubo un error al intentar eliminar el elemento',
        deleteSuccess: 'Datos eliminados exitosamente',

        //textos al eliminar un objeto
        deleteMsg: '¿Está seguro de eliminar el objeto seleccionado?',
        deleteTitle: 'Eliminar Objeto'
    };

    var messageTitles = {
        saveError: 'Hubo un error al intentar guardar los datos:'
    };

    var newPath = 'nuevo';

    this.setBasePath = function(path) {
        basePath = path;
        return this;
    };

    this.setMessages = function(msg) {
        messages.saveError = (msg.saveError) ? msg.saveError : messages.saveError;
        messages.saveSuccess = (msg.saveSuccess) ? msg.saveSuccess : messages.saveSuccess;
        messages.loadError = (msg.loadError) ? msg.loadError : messages.loadError;
        messages.getError = (msg.getError) ? msg.getError : messages.getError;
        messages.deleteError = (msg.deleteError) ? msg.deleteError : messages.deleteError;
        messages.deleteSuccess = (msg.deleteSuccess) ? msg.deleteSuccess : messages.deleteSuccess;
        messages.deleteMsg = (msg.deleteMsg) ? msg.deleteMsg : messages.deleteMsg;
        messages.deleteTitle = (msg.deleteTitle) ? msg.deleteTitle : messages.deleteTitle;

        return this;
    };

    this.setMessageTitles = function(titles) {
        messageTitles.saveError = (titles.saveError) ? titles.saveError : messageTitles.saveError;

        return this;
    };

    this.setNewPath = function(val) {
        newPath = val;
    };

    this.$get = function() {
        return {
            basePath: basePath,
            messages: messages,
            messageTitles: messageTitles,
            newPath: newPath
        };
    };
});;angular.module('adminPanel.crud').service('CrudService', [
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
]);;angular.module('adminPanel.navigation', [
    'adminPanel'
]).

component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', '$location',
        function ($scope, $timeout, AdminPanelConfig, $location) {
            $scope.items = {};
            $scope.elem = $('navigation');
            $scope.activeRole = null;
            $scope.currentRoute = null;
            $scope.baseIndex = null;
        
            /**
             * @description Indica si un item de la lista debe mostrarse o no
             * 
             * @param {object} item Item de la lista
             * @returns {boolean}
             */
            function showItem(item) {
                if (!item.roles || !$scope.activeRole) {
                    return true;
                }
                if (angular.isArray(item.roles)) {
                    return item.roles.some(function(role) {
                        return isActiveRole(role);
                    });
                }
                return isActiveRole(item.roles);
            }
        
            /**
             * @description Indica si un determinado rol de usuario se ecnuentra activo o no
             * 
             * @param {(string|Array)} role Rol o roles de usuario
             * @returns {boolean}
             */
            function isActiveRole(role) {
                if (angular.isArray($scope.activeRole)) {
                    return $scope.activeRole.includes(role);
                }
                return role === $scope.activeRole;
            }
        
            /**
             * @description Incializar accordion de Foundation
             */
            function initializeAccordion() {
                $timeout(function() {
                    $scope.accordion = new Foundation.AccordionMenu($scope.elem);
                    $scope.elem.find('> .menu').addClass('visible');

                    var nestedItemActive = $scope.elem.find('> .menu .nested li.is-active a');
                    if (nestedItemActive && nestedItemActive.length > 0) {
                        nestedItemActive = nestedItemActive.parent().parent();
                        $scope.accordion.$element.foundation('down', nestedItemActive);
                    }
                });
            }


            /**
             * @description Destruir accordion
             */
            function destroyAccordion() {
                if($scope.accordion) {
                    $scope.accordion.$element.foundation('_destroy');
                }
            }

            /**
             * @description Genera los items del menu basándose en $scope.activeRole
             */
            function generateItems() {
                $scope.items = {};
                for(var item in AdminPanelConfig.navigationItems) {
                    if (showItem(AdminPanelConfig.navigationItems[item])) {
                        $scope.items[item] = angular.copy(AdminPanelConfig.navigationItems[item]);
                    }
                }
            }
        
            /**
             * @description Función que se llama cuando se cambia de ruta y cuando se inicializa el accordion.
             * 
             * @param {string} route ruta actual
             */
            function changeRoute(route) {
                $scope.currentRoute = route;
                var index = 0;
                for(var item in $scope.items) {
                    if($scope.items[item].link === '#') {
                        //el elemento tiene items anidados
                        for(var nestedItem in $scope.items[item].items) {
                            var r = $scope.items[item].items[nestedItem].link;
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

            /**
             * @description Evento que recibe los datos del usuario logueado y modifica el menu según el rol.
             * 
             * @param {object} e Event
             * @param {object} data Datos de usuario. Ej: data: {roles: ['ROLE1', 'ROLE2']}
             */
            $scope.$on('userData', function(e, data) {
                if (data) {
                    if ($scope.activeRole !== data.roles) {
                        $scope.activeRole = data.roles;
                        generateItems();
                        destroyAccordion();
                        initializeAccordion();
                        changeRoute($location.path());
                    }
                } else {
                    $scope.items = {};
                    $scope.activeRole = null;
                    destroyAccordion();
                    initializeAccordion();
                    changeRoute($location.path());
                }
            });
        
            $scope.checkRoute = function(route) {
                var routeAux = route.slice(route.indexOf('/'));
                return {
                    'is-active': routeAux === $scope.currentRoute
                };
            };
        
            this.$onDestroy = function() {
                destroyAccordion();
            };
        
            $scope.$on('$routeChangeSuccess', function(e, route) {
                changeRoute($location.path());
            });
        }
    ]
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
]);*/;function topBarController($scope, AuthenticationService, AdminPanelConfig, $location) {
    
    $scope.title = AdminPanelConfig.topBarTitle;
    
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
    controller: ['$scope', 'AuthenticationService', 'AdminPanelConfig', '$location', topBarController]
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
                    multiExpand: scope.multiExpand,
                    allowAllClosed: scope.allowAllClosed
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
}]);;/**
 * @description Elemento que agrupa contenido. Ver componente card de foundation.
 * Attrs:
 *      - title: Título del card
 *      - init: Función que se ejecuta al inicializar el componente.
 */
angular.module('adminPanel').directive('apBox', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'AE',
            priority: 100,
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
                    scope.isHide = scope.closeButton;
                    scope.showOnEventSource = null;

                    attr.$observe('title', function(val) {
                        scope.title = val;
                    });

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
                    //evento con el nombre determinado para el box. Si name es un
                    //objeto se usa el atributo destination de name y se guarda el
                    //valor source de name.
                    function showOnEvent(e, name) {
                        if (angular.isUndefined(name) || name === null) {
                            return;
                        }
                        if (attr.name === name) {
                            scope.isHide = false;
                        } else if (typeof name === 'object' && attr.name === name.destination) {
                            scope.isHide = false;
                            scope.showOnEventSource = name.source; 
                        }
                    }

                    //Funcion que se usa para ocultar el box al lanzar determinado
                    //evento con el nombre determinado para el box. Si name es un
                    //objeto se usa el atributo destination de name y se emite un
                    //evento llamado '' con los datos de name.data
                    function hideOnEvent(e, name) {
                        if (angular.isUndefined(name) || name === null) {
                            return;
                        }
                        if (attr.name === name) {
                            scope.isHide = true;
                        } else if (typeof name === 'object' && attr.name === name.destination) {
                            scope.isHide = true;
                            if (name.data) {
                                $rootScope.$broadcast('select:loadSelectedData', {
                                    destination: scope.showOnEventSource,
                                    data: name.data
                                });
                            }
                        }
                    }

                    //Funcion ejecutada para cerrar el box
                    scope.close = function () {
                        $rootScope.$broadcast('apBox:hide', attr.name);
                    };

                    elem.on('mouseenter', onMouseEnter);
                    var onMouseEnterInOtherBoxDestructor = scope.$on('box.directive.mouseenter', onMouseEnterInOtherBox);
                    var showOnEventDestructor = scope.$on('apBox:show', showOnEvent);
                    var hideOnEventDestructor = scope.$on('apBox:hide', hideOnEvent);
                    var destroyEventDestructor = scope.$on('$destroy', function () {
                        //Unbind events
                        elem.off('mouseenter', onMouseEnter);
                        onMouseEnterInOtherBoxDestructor();
                        showOnEventDestructor();
                        hideOnEventDestructor();
                        destroyEventDestructor();
                    });

                    if (scope.init) {
                        scope.init();
                    }
                };
            },
            templateUrl: 'directives/boxes/box/box.template.html'
        };
    }
]);
;/**
 * @description Elemento que agrupa contenido. Características:
 *  -   Utiliza el componente card de foundation.
 *  -   No usa la directiva ap-load del admin-panel.
 *  -   Se le puede indicar el título del card.
 *  -   Se le puede indicar un estado.
 *
 *  Attrs:
 *      - title: Título del card
 *      - state: Posibles valores:
 *          - 'hideContent' : Muestra un mensaje indicando que el usuario no cuenta con los permisos para ver el contenido.
 *          - 'noContent' : Muestra un mensaje indicando que el contenedor está vacío.
 *          - 'noEditable' : Muestra un mensaje indicando que el usuario no cuenta con los permisos para editar el contenido.
 */
angular.module('adminPanel').directive('apBoxState', [
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                title: '@',
                state: '<',
                helpMessage: '@'
            },
            link: function($scope, element, attr, ctrl, transclude) {
                
                $scope.title = $scope.title ? $scope.title : '';
                $scope.state = $scope.state ? $scope.state : '';
                $scope.helpMessage = $scope.helpMessage ? $scope.helpMessage : '';
                $scope.mouseOver = false;

                $scope.message = {
                    text: '',
                    icon: ''
                };

                /**
                 * Watcher que actualiza el estado
                 */
                $scope.$watch('state', function(newValue, oldValue) {
                    
                    switch (newValue) {
                        case 'hideContent':
                            $scope.message = {
                                text: 'No tiene permisos para ver este contenido.',
                                icon: 'fa-eye-slash'
                            };
                            break;
                        case 'noContent':
                            $scope.message = {
                                text: 'No hay datos cargados.',
                                icon: 'fa-minus-circle'
                            };
                            break;
                        case 'noEditable':
                            $scope.message = {
                                text: 'No tiene permisos para editar este contenido.',
                                icon: 'fa-times-circle'
                            };
                            break;
                        default :
                            $scope.message = {
                                text: '',
                                icon: ''
                            };
                            break;
                    }
                });

                /**
                 * Evento usado para mostrar mensaje
                 */
                $scope.onMouseOver = function (e) {
                    $scope.mouseOver = true;
                };

                /**
                 * Evento usado para ocultar mensaje
                 */
                $scope.onMouseLeave = function (e) {
                    $scope.mouseOver = false;
                };
            },
            templateUrl: 'directives/boxes/boxState/boxState.template.html'
        };
    }
]);;
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
;/**
 * @description Foundation tooltip.
 */
angular.module('adminPanel').directive('apDataTooltip', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                
                element.attr('data-tooltip', '');

                $timeout(function() {
                    element.foundation();
                });
            }
        };
    }
]);;angular.module('adminPanel').directive('apDatePicker',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                scope.label = scope.label ? scope.label : '';
                scope.date = null;

                var options = {
                    format: 'dd/mm/yyyy',
                    language: 'es'
                };

                //Funcion que realiza el cambio de la hora en el modelo
                function changeDate(date) {
                    //cambio hecho al terminar el ciclo $digest actual
                    $timeout(function() {
                        scope.$apply(function() {
                            ngModel.$setViewValue(date);
                        });
                    });
                }

                //Se inicializa el componente fdatepicker en la vista y se le asigna un eventListener para
                //detectar cuando se cambia la hora
                $(elem.find('.date')).fdatepicker(options).on('changeDate', function(ev) {
                    scope.date = ev.date;
                    scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                    changeDate(scope.date);
                });

                /**
                 * Evento disparado cuando cambia el valor del modelo y la vista necesita actualizarse.
                 */
                ngModel.$render = function() {
                    if(ngModel.$modelValue) {
                        var date = new Date(ngModel.$modelValue);
                        if(isNaN(date)) {
                            return; //la fecha no es valida
                        }
                        scope.date = date;
                        $(elem.find('.date')).fdatepicker('update', date);
                    } else {
                        $(elem.find('input')).val(null);
                    }
                };
            },
            templateUrl: 'directives/datePicker/datePicker.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apDateTimePicker', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                
                scope.hours = null;
                scope.minutes = null;
                scope.date = null;
                scope.label = scope.label ? scope.label : '';

                var options = {
                    format: 'dd/mm/yyyy',
                    language: 'es'
                };

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
                $(elem.find('.date')).fdatepicker(options)
                        .on('changeDate', function(ev){
                    scope.date = ev.date;
                    scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                    changeDateTime(scope.date);
                });

                //Funcion que se ejecuta al cambiar de hora en la vista
                scope.changeHour = function() {
                    if (typeof scope.hours === 'undefined') {
                        return;
                    }
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
                    if (typeof scope.minutes === 'undefined') {
                        return;
                    }
                    if(scope.minutes < 0) {
                        scope.minutes = 0;
                    }
                    if(scope.minutes > 59) {
                        scope.minutes = 59;
                    }
                    changeDateTime(scope.date, scope.hours, scope.minutes);
                };

                /**
                 * Evento disparado cuando cambia el valor del modelo y la vista necesita actualizarse.
                 */
                ngModel.$render = function() {
                    if(ngModel.$modelValue) {
                        var date = new Date(ngModel.$modelValue);
                        if(isNaN(date)) {
                            return; //la fecha no es valida
                        }
                        scope.date = date;
                        $(elem.find('.date')).fdatepicker('update', date);
                        scope.hours = date.getHours();
                        scope.minutes = date.getMinutes();
                    } else {
                        $(elem.find('input')).val(null);
                    }
                };
            },
            templateUrl: 'directives/dateTimePicker/dateTimePicker.template.html'
        };
    }
]);
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

                        var fileName = r.headers('Content-Disposition').split('filename').pop().replace(/['"=]+/g, '');

                        var blob = new Blob([r.data], {
                            type: scope.type + ";charset=utf-8"
                        });

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
]);;/**
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
]);;/**
 * @description Atributo que se coloca en un elemento para que
 *              actue como botón que redirecciona a una parte
 *              específica del documento.
 *
 *  Ejemplo de uso:
 *  <ul class="menu vertical">
 *      <li><a href="" ap-go-to-anchor="elem1Id">Go to element 1</a></li>
 *      <li><a href="" ap-go-to-anchor="elem2Id">Go to element 2</a></li>
 *  </ul>
 *  Attrs:
 *      - ap-go-to-anchor: Id del elemento donde se va a colocar la pantalla.
 */
angular.module('adminPanel').directive('apGoToAnchor',[
    '$timeout', '$document',
    function($timeout, $document) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {

                scope.options = {
                    duration: 500,
                    offest: 60,
                    easing: function (t) {
                        return t;
                    }
                };

                element.bind("click", function(e) {
                    var element = angular.element(document.getElementById(attrs.apGoToAnchor));
                    if (element) {
                        $timeout( function () {
                            $document.scrollToElement(
                                element,
                                scope.options.offest,
                                scope.options.duration,
                                scope.options.easing
                            ).then(
                                function() {
                                    //El scroll fue realizado con éxito
                                },
                                function() {
                                    //El scroll falló, posiblemente porque otro fue iniciado
                                }
                            );
                        });
                    }
                });
            }
        };
    }
]);;/**
 * @description Atributo que redirecciona con el evento de click.
 *              Similar al atributo href del elemento <a>.
 */
angular.module('adminPanel').directive('apGoToPath', [
    '$location',
    function ($location) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                var path;

                attrs.$observe('apGoToPath', function (val) {
                    path = val;
                });

                element.bind('click', function () {
                    scope.$apply(function () {
                        $location.path(path);
                    });
                });
            }
        };
    }
]);;angular.module('adminPanel').directive('apImageLoader', [
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
                }, function (modelValue) {});
                
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
                        if (!scope.apInfoOnTableController) {
                            return;
                        }
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
    function($animate, $compile) {
        return {
            restrict: 'A',
            priority: 50,
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

                var startEventDestructor = scope.$on('apLoad:start', function(e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    scope.hide();
                });
                var finishEventDestructor = scope.$on('apLoad:finish', function(e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    scope.show();
                });

                var destroyEventDestructor = scope.$on('$destroy', function () {
                    startEventDestructor();
                    finishEventDestructor();
                    destroyEventDestructor();
                });
            },
            controller: ['$scope', function($scope) {

                this.getName = function() {
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
;/**
 * @description Magellan
 */
angular.module('adminPanel').directive('apMagellan',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                items: '<',
                title: '@'
            },
            link: function($scope, element, attr) {

                /**
                 * Eliminar los items que referencian a un id que no existe.
                 */
                function filterItems() {
                    for (var key in $scope.items) {
                        if ($scope.items[key] && !angular.element('#' + $scope.items[key]).length) {
                            delete $scope.items[key];
                        }
                    }
                }

                $scope.$on('magellan:filterItems', function(e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    $timeout(filterItems);
                });
            },
            templateUrl: 'directives/magellan/magellan.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apMessage', [
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
                elem.addClass('row columns ap-message-container');
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
                var htmlElem = elem.find('.reveal');
                var fnToRealize = null;
                
                //init
                $timeout(function() {
                    htmlElem.foundation();
                });

                scope.yes = function() {
                    if(fnToRealize !== null) {
                        fnToRealize();
                    }
                    htmlElem.foundation('close');
                };
                
                scope.no = function() {
                    htmlElem.foundation('close');
                };
                
                scope.$on('ap-confirm-modal:show', function(e, data) {
                    scope.title = data.title;
                    scope.text = data.text;
                    
                    fnToRealize = angular.isFunction(data.fn) ? data.fn : null;
                    
                    $timeout(function() {
                        htmlElem.foundation('open');
                    });
                });
            },
            templateUrl: 'directives/modals/confirm/confirmModal.template.html'
        };
    }
]);
;/**
 * @description Modal con clase Reveal de foundation.
 *
 *  Ejemplo de uso:
 *  <a class="tiny button" ap-show-modal="modalId"><i class="fa fa-info medium animate"></i></a>
 *  <ap-modal id="modalId" dialog-buttons confirm-button-type="alert">
 *      <h4>Título de Modal</h4>
 *      <p class="lead">Contenido del modal.</p>
 *  </ap-modal>
 *
 *  Attrs:
 *      - dialog-buttons: Hace que se muestren dos botones en el modal:
 *        "confirmar" y "cancelar". El botón "confirmar" hace que se emita un evento
 *        con nombre "modalConfirm", enviando como dato el ID del modal.
 *      - confirm-button-type: Permite asignarle el estilo al botón de "confirmar"
 *        cuando la opción "dialog-buttons" esta activa. Las opciones son:
 *        "primary", "secondary", "success", "alert", "warning".
 *      - id: id del elemento, lo usa el botón un otro elemento que tenga la directiva
 *        ap-show-modal para saber qué modal abrir.
 */
angular.module('adminPanel').directive('apModal',[
    '$timeout', '$document',
    function($timeout, $document) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                id: '@'
            },
            link: function(scope, element, attrs, ctrl, transclude) {

                //Constantes
                var ESC_KEY_CODE = 27;

                //Inicializar variables del scope
                scope.dialogButtons = angular.isUndefined(attrs.dialogButtons) ? false : true;
                scope.confirmButtonType = attrs.confirmButtonType;
                scope.show = false;

                scope.hideModal = function() {
                    scope.show = false;
                };

                scope.showModal = function() {
                    scope.show = true;
                };

                function escHandler (event) {
                    if (scope.show === true && event.keyCode === ESC_KEY_CODE) {
                        $timeout(scope.hideModal, 0);
                        event.preventDefault();
                    }
                }

                /**
                 * Evento disparado al destruir la directiva
                 */
                scope.$on('$destroy', function() {
                    $document.off('keydown', escHandler);
                });

                $document.on('keydown', escHandler);
            },
            controller: ['$scope', function($scope) {

                //Evento disparado al presionar el botón confirmar
                $scope.confirm = function() {
                    $scope.$emit('modalConfirm', {id: $scope.id});
                    //Se usa $timeout para ejecutar la función cuando terminen los eventos asíncronos
                    $timeout($scope.hideModal, 0);
                };

                //Event listener para abrir el modal
                $scope.$on("showModal", function (event, data) {
                    if (data.id === $scope.id) {
                        //Se usa $timeout para ejecutar la función cuando terminen los eventos asíncronos
                        $timeout($scope.showModal, 0);
                    }
                });

                //Event listener 2 para abrir el modal
                $scope.$on('apBox:show', function showOnEvent(e, name) {
                    if (name === $scope.id) {
                        //Se usa $timeout para ejecutar la función cuando terminen los eventos asíncronos
                        $timeout($scope.showModal, 0);
                    }
                });
            }],
            templateUrl: 'directives/modals/modal/modal.template.html'
        };
    }
]);;/**
 * @description Atributo para abrir ap-modals.
 *
 *  Ejemplo de uso:
 *  <a class="tiny button" ap-show-modal="modalId1"><i class="fa fa-info medium animate"></i></a>
 *  <a class="tiny button" ap-show-modal="modalId2"><i class="fa fa-info medium animate"></i></a>
 *  <ap-modal id="modalId1">
 *      <p class="lead">Este modal se abre con el primer botón.</p>
 *  </ap-modal>
 *  <ap-modal id="modalId2">
 *      <p class="lead">Este modal se abre con el segundo botón.</p>
 *  </ap-modal>
 *  Attrs:
 *      - ap-show-modal: Id del modal que se va a abrir al hacer click en el elemento.
 */
angular.module('adminPanel').directive('apShowModal',[
    '$rootScope',
    function($rootScope) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                element.bind("click", function(e) {
                    $rootScope.$broadcast("showModal", {id: attrs.apShowModal});
                });
            }
        };
    }
]);;angular.module('adminPanel').directive('msfCoordenadas', [
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
;angular.module('adminPanel').directive('apNumberInput', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                max: '@',
                min: '@',
                step: '@',
                previousLabel: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                scope.label = scope.label ? scope.label : '';
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;
                scope.previousLabel = scope.previousLabel ? scope.previousLabel : null;

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/numberInput/numberInput.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apOffCanvas', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                elem.addClass('off-canvas');
                $timeout(function() {
                    elem.foundation();
                });
            }
        };
    }
]);

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
                        if (this.currentPage == this.bottomPage) {
                            this.enablePreviousPage = false;
                        }
                        if (this.currentPage == this.topPage) {
                            this.enableNextPage = false;
                        }
                        this.pages = generatePages(this.bottomPage, this.topPage);
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
]);;/**
 * @description Filtro aplicado a las opciones del select
 */
angular.module('adminPanel').filter('selectOption', function() {
    return function(input) {
        var output = input;
        if (input === '') {
            output = ' - Sin selección -';
        }
        return output;
    };
});;/**
 * @description Provider que guarda las opciones de los selects con el fin de disminuir la cantidad de request realizadas
 * al servidor.
 *
 */
angular.module('adminPanel').factory('apSelectProvider', function() {
        var options = {};

        options.data = {};

        options.register = function(entity, field, request) {
            if (angular.isUndefined(options.data[entity])) {
                options.data[entity] = {};
            }
            options.data[entity][field] = request;
        };

        options.get = function(entity, field) {
            if (angular.isUndefined(options.data[entity])) {
                return null;
            }
            return options.data[entity][field];
        };
        
        options.remove = function(entity, field) {
            if (!angular.isUndefined(options.data[entity])) {
                options.data[entity][field] = null;
            }
        };

        return options;
    }
);;/**
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
]);;/**
 * @description Provider que guarda las opciones de los selects con el fin de disminuir la cantidad de request realizadas
 * al servidor.
 *
 */
angular.module('adminPanel').factory('apSelectMultipleProvider', function() {
        var options = {};

        options.data = {};

        options.register = function(entity, field, request) {
            if (angular.isUndefined(options.data[entity])) {
                options.data[entity] = {};
            }
            options.data[entity][field] = request;
        };

        options.get = function(entity, field) {
            if (angular.isUndefined(options.data[entity])) {
                return null;
            }
            return options.data[entity][field];
        };

        return options;
    }
);;/**
 * @description Muestra una lista de pasos.
 *
 *  Ejemplo de uso:
 *  <ap-step-by-step>
 *      <li>First Step</li>
 *      <li class="active">Current Step</li>
 *      <li class="disabled">Next Step</li>
 *  </ap-step-by-step>
 *
 *  Clases:
 *      - expanded even-N: Hace que la lista ocupe todo el ancho posible.
 *        Usar expanded y even-N juntos. Reemplazar N por cantidad de elementos <li>
 *      - vertical: Muestra la lista de pasos en forma vertical
 *      - round: aplica border-radius
 */
angular.module('adminPanel').directive('apStepByStep',[
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {},
            link: function($scope, elem, attr) {
            },
            templateUrl: 'directives/stepByStep/stepByStep.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apSwitch', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                name: '@',
                label: '@',
                ngModel: '='
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/switch/switch.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apTab',[
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                name: '@',
                title: '@',
                state: '@',
                endIcon: '<'
            },
            require: '^apTabs',
            link: function($scope, elem, attr, tabsCtrl) {

                if (!$scope.name) {
                    console.error('Tab directive requires "name" attribute.');
                    return;
                }

                $scope.loadedContent = false; //Indica si su contenido ya fue cargado en el DOM

                /**
                 * Indica si la pestaña debe o no mostrar su contenido
                 * @return {Boolean} isVisible
                 */
                $scope.isVisible = function() {
                    return tabsCtrl.isActive(attr.name);
                };

                /**
                 * Indica si la pestaña fue abierta al menos una vez
                 * @return {Boolean} wasOpened
                 */
                $scope.wasOpened = function() {
                    if (!$scope.loadedContent && tabsCtrl.isActive(attr.name)) {
                        $scope.loadedContent = true;
                    }
                    return $scope.loadedContent;
                };

                /**
                 * Watcher para actualizar los datos
                 * @return {Boolean}
                 */
                $scope.$watchGroup(['title', 'state', 'endIcon'], function(newValues, oldValues) {
                    tabsCtrl.register($scope.name, newValues[0], newValues[1], newValues[2]);
                });
            },
            templateUrl: 'directives/tabs/tab.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apTabs',[
    '$location', '$timeout', '$window',
    function($location, $timeout, $window) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                onChange: '&'
            },
            link: function($scope, elem) {
                $scope.tabs = {};
                $scope.active = null;
                $scope.allowScrollToLeft = false;
                $scope.allowScrollToRight = true;
                $scope.enableScrollButtons = false;
                
                var tabsElement = elem.find('.tabs');
                var scrollDuration = 700;

                enableOrDisableScrollButtons();

                tabsElement.bind('scroll', function() {
                    showOrHideScrollButtons();
                });

                angular.element($window).bind('resize', function() {
                    enableOrDisableScrollButtons();
                });

                /**
                 * Cambia el estado de un Tab
                 * @param {Object} tab
                 * @return {undefined}
                 */
                $scope.switch = function (tab) {
                    if (tab.state === 'default') {
                        $scope.scrollToElement($location.hash());
                        $timeout(function() {
                            if ($scope.active !== tab.name) {
                                $scope.active = tab.name;
                                $location.hash(tab.name);
                                if ($scope.onChange) {
                                    $scope.onChange();
                                }
                            }
                        });
                    }
                };

                /**
                 * Permite que cambie el tab activo al cambiar el hash de  la ruta
                 */
                $scope.$on('$routeUpdate', function() {
                    if($location.hash() in $scope.tabs) {
                        $timeout(function() {
                            $scope.active = $location.hash();
                            $scope.scrollToElement($location.hash());
                        });
                    }
                });

                $scope.scrollToLeft = function() {
                    scroll(getScrollStep() * -1);
                };

                $scope.scrollToRight = function() {
                    scroll(getScrollStep());
                };

                $scope.scrollToElement = function(tabName) {
                    $timeout(function() {
                        var tabElement = angular.element(document.getElementById('tab-' + tabName));
                        scroll(null, tabElement);
                    });
                };

                /**
                 * Calcula el paso del scroll a partir del tamaño del elemento html
                 */
                function getScrollStep() {
                    return tabsElement[0].scrollWidth / Math.ceil(tabsElement[0].scrollWidth / tabsElement[0].clientWidth);
                }

                /**
                 * Habilita o deshabilita los botones de scroll dependiendo del tamaño
                 * del elemento html.
                 */
                function enableOrDisableScrollButtons() {
                    $timeout(function() {
                        if (tabsElement[0].clientWidth < tabsElement[0].scrollWidth) {
                            $scope.enableScrollButtons = true;
                        } else {
                            $scope.enableScrollButtons = false;
                        }
                    });
                }

                /**
                 * Oculta o no los botones de desplazamiento dependiendo del scroll
                 * actual del elemento.
                 */
                function showOrHideScrollButtons() {
                    $timeout(function() {
                        var scrollLeft = tabsElement.scrollLeft();
                        
                        if (scrollLeft <= 0) {
                            $scope.allowScrollToLeft = false;
                        } else {
                            $scope.allowScrollToLeft = true;
                        }

                        if (scrollLeft >= tabsElement[0].scrollLeftMax) {
                            $scope.allowScrollToRight = false;
                        } else {
                            $scope.allowScrollToRight = true;
                        }
                    });
                }

                /**
                 * Realiza el desplazamiento del elemento tabs.
                 * @param {int} step cantidad de píxeles que debe desplazarse el 
                 * elemento
                 * @param {DOMElement} element elemento tab que indica la posición
                 * final del scroll. Si element existe se ignora el paŕametro step.
                 */
                function scroll(step, element) {
                    var position = null;
                    if (element && element[0]) {
                        position = element.prop('offsetLeft') - 0.5*tabsElement[0].clientWidth-32+0.5*element[0].clientWidth;
                    } else {
                        position = tabsElement.scrollLeft() + step;
                    }

                    tabsElement.scrollLeftAnimated(
                        position, scrollDuration
                    );
                }
            },
            controller: ['$scope', function($scope) {

                /**
                 * Registra o actualiza un Tab
                 * @param {String} name
                 * @param {String} title
                 * @return {undefined}
                 */
                this.register = function(name, title, state, endIcon) {
                    $scope.tabs[name] = {
                        name: name, 
                        title: title || name,
                        state: state || 'default',
                        endIcon: endIcon || null
                    };
                    if (!$scope.active && state!='disabled') {
                        $scope.active = name;
                        $scope.scrollToElement(name);
                    }
                    if ($location.hash() === name && state !== 'disabled') {
                        $scope.active = name;
                        $scope.scrollToElement(name);
                    }
                };

                /**
                 * Verifica si el Tab con nombre "name" esta activo
                 * @param {String} name
                 * @return {Boolean} active
                 */
                this.isActive = function(name) {
                    return $scope.active === name;
                };

            }],
            templateUrl: 'directives/tabs/tabs.template.html'
        };
    }
]);;angular.module('adminPanel').directive('apTextInput', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                maxlength: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                var DEFAULT_MAX_LENGTH = 300;

                scope.label = scope.label ? scope.label : '';
                scope.maxlength = scope.maxlength ? scope.maxlength : DEFAULT_MAX_LENGTH;
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/textInput/textInput.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apTextarea', [
    function() {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@',
                ngModel: '=',
                placeholder: '@',
                maxlength: '@',
                helpInfo: '@'
            },
            link: function(scope, elem, attr, ngModelCtrl) {
                
                var DEFAULT_MAX_LENGTH = 6000;

                scope.label = scope.label ? scope.label : '';
                scope.maxlength = scope.maxlength ? scope.maxlength : DEFAULT_MAX_LENGTH;
                scope.placeholder = scope.placeholder ? scope.placeholder : scope.label;
                scope.modalId = attr.name + 'Modal';

                scope.updateModel = function() {
                    ngModelCtrl.$setViewValue(scope.ngModel);
                };
            },
            templateUrl: 'directives/textarea/textarea.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apTimePicker', [
    '$timeout',
    function($timeout) {
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
    }
]);
;/**
 * @description Filtro que deja con mayúscula solo la primera letra de una palabra
 *              o frase.
 * 
 * @param {String} input Ejemplo: 'la frase comenzará con mayúscula'.
 * @returns {String} Ejemplo: 'La frase comenzará con mayúscula'.
 */
angular.module('adminPanel.filters').filter('capitalizeFirstLetter', function () {
    return function (input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
});;/**
 * @description Filtro que deja con mayúscula solo la primera letra de cada palabra.
 *              Se debe especificar qué caracter separa cada palabra, de lo contrario se usa el
 *              espacio en blanco.
 * 
 * @param {String} input Ejemplo: 'cada palabra quedará con mayúscula'.
 * @returns {String} Ejemplo: 'Cada Palabra Quedará Con Mayúscula'.
 */
angular.module('adminPanel.filters').filter('capitalizeFirstLetters', [
    'capitalizeFirstLetterFilter',
    function (capitalizeFirstLetterFilter) {
        return function (input, separatorCharacter) {
            separatorCharacter = separatorCharacter ? separatorCharacter : " ";

            var outputArray = input.split(separatorCharacter);
            var output = "";

            outputArray.forEach(function (element, key, array) {
                output += capitalizeFirstLetterFilter(element);
                if (key !== array.length - 1) {
                    output += separatorCharacter;
                }
            });

            return output;
        };
    }
]);;/**
 * @description Filtro que concatena un array de valores.
 * 
 * @param {Array} input ['item1', 'item2', 'item3'].
 * @param {String} delimiter Caracter que une los elementos del input.
 * @returns {String} Ejemplo: 'intem1, item2, intem3'
 */
angular.module('adminPanel.filters').filter('concat', function () {
    return function (input, delimiter) {
        if (angular.isUndefined(input) || input === null) {
            return '';
        } else if (!Array.isArray(input)) {
            return input;
        } else {
            var newInputData = [];
            input.forEach(function (element) {
                if (angular.isDefined(element) && element !== null) {
                    newInputData.push(element);
                }
            });
            if (delimiter) {
                return newInputData.join(delimiter);
            } else {
                return newInputData.join();
            }
        }
    };
});;/**
 * @description Filtro que resalta una frase de un texto.
 * 
 * @param {String} input Texto que contiene la frase que será resaltada.
 * @param {String} phrase Frase a resaltar.
 * @returns {Object}
 */
angular.module('adminPanel.filters').filter('highlight', [
    '$sce',
    function ($sce) {
        return function (input, phrase) {
            if (phrase) {
                input = input.replace(new RegExp('(' + phrase + ')', 'gi'),
                    '<span class="highlighted">$1</span>');
            }
            return $sce.trustAsHtml(input);
        };
    }
]);
;/**
 * @description Filtro para motrar el tiempo transcurrido en días, meses o años.
 * 
 * @param input Cantidad de días, meses o años.
 * @param {String} timeUnit 'días', 'meses' o 'años'.
 * @param {String} initialWords Cualquier string que se quiera anteponer a la frase.
 * @returns {String} Ejemplos: 'Hace 3 años', 'Hace 2 días', '1 mes'.
 */
angular.module('adminPanel.filters').filter('howLong', function () {
    return function (input, timeUnit, initialWords) {

        if (angular.isUndefined(input) || input === null) {
            return '';
        }
        if (typeof timeUnit !== 'string' || timeUnit === null) {
            return '';
        }
        if (typeof initialWords !== 'string') {
            initialWords = '';
        } else {
            initialWords += ' ';
        }
        timeUnit = timeUnit.toLowerCase();
        if (input == '1') {
            switch (timeUnit) {
                case 'días':
                    timeUnit = 'día';
                    break;
                case 'meses':
                    timeUnit = 'mes';
                    break;
                case 'años':
                    timeUnit = 'año';
                    break;
            }
        }
        return initialWords + input + ' ' + timeUnit;
    };
});;/**
 * @description Filtro para mostrar 'Si' si el input es verdadero o 'No'
 *              si es falso.
 * 
 * @param input Valor que será evaluado.
 * @returns {String} 'Si' o 'No'
 */
angular.module('adminPanel.filters').filter('yesNo', function () {
    return function (input) {
        return input ? 'Si' : 'No';
    };
});;angular.module('adminPanel').service('WindowResize', [
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

    var topBarTitle = 'Admin Panel';
    
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
     *
     * // Example with roles
     * var items = {
     *   'Item menu name': {
     *     link: 'link',
     *     roles: ['Role1', 'Role2'],
     *     items: {
     *       'Nested item menu':{
     *          link: 'link',
     *          roles: 'Role2'
     *       }
     *     }
     *   },
     *   ...
     * }
     */
    this.setNavigationItems = function(items) {
        navigationItems = angular.copy(items);
        for(var item in navigationItems) {
            navigationItems[item].link = (navigationItems[item].link) ? '#!' + navigationItems[item].link : '#';
            navigationItems[item].roles = navigationItems[item].roles || null;
            for(var nestedItem in navigationItems[item].items) {
                var nestedItemData = navigationItems[item].items[nestedItem];
                navigationItems[item].items[nestedItem] = {
                    link: angular.isString(nestedItemData) ? '#!' + nestedItemData : '#!' + nestedItemData.link,
                    roles: nestedItemData.roles ? nestedItemData.roles : null
                };
            }
        }
        return this;
    };

    /**
     * @param {string} title Título de la barra
     */
    this.setTopBarTitle = function(title) {
        topBarTitle = title;
    };

    this.$get = [
        function () {
            return {
                imgLoadingRsc: imgLoadingRsc,
                pagination: pagination,
                defaultFormMessages: defaultFormMessages,
                navigationItems: navigationItems,
                topBarTitle: topBarTitle,
                windowMinSizes: windowMinSizes
            };
        }
    ];
});;/**
 * @description Función que busca un valor en la intersección de dos arreglos
 *
 * @param {Array} array1 Arreglo usado para calcular la intersección
 * @param {Array} array2 Arreglo usado para calcular la intersección
 * @param {String} value Valor que se busca en la intersección de array1 y array2
 * @returns {Boolean} Indica si value se encontró o no
 */
angular.module('adminPanel.utils').factory('findInArrayIntersection', [
    function() {
        var findInArrayIntersection = function (array1, array2, value) {
            var found = false;
            var i = 0;
            while (i < array2.length && !found) {
                var j = array2[i];
                if (angular.isArray(array1[j])) {
                    found = array1[j].indexOf(value) >= 0;
                }
                i++;
            }
            return found;
        };

        return findInArrayIntersection;
    }]
);;/**
 * @description Obtiene una propiedad de un objeto, de cualquiera de sus hijos,
 *              hijos de hijos, etc.
 * 
 * @param {Object} obj Cualquier objeto
 * @param key Propiedad que se quiere obtener del objeto. Ejemplo: 'loc.foo.bar'
 */
angular.module('adminPanel.utils').factory('getProperty', [
    function () {
        var getProperty = function (obj, key) {
            return key.split(".").reduce(function (o, x) {
                return (typeof o == "undefined" || o === null) ? o : o[x];
            }, obj);
        };

        return getProperty;
    }
]);;/**
 * @description Pregunta si una determinada propiedad de un objeto,
 *              de cualquiera de sus hijos, hijos de hijos, etc existe.
 * 
 * @param {Object} obj Cualquier objeto
 * @param key Propiedad por la que se pregunta. Ejemplo: 'loc.foo.bar'
 */
angular.module('adminPanel.utils').factory('hasProperty', [
    function () {
        var hasProperty = function (obj, key) {
            return key.split(".").every(function (x) {
                if (typeof obj != "object" || obj === null || !(x in obj)) {
                    return false;
                }
                obj = obj[x];
                return true;
            });
        };

        return hasProperty;
    }
]);;angular.module('adminPanel').run(['$templateCache', function ($templateCache) {
  $templateCache.put("admin-panel.template.html",
    "<div ap-user><div class=wrapper-header><top-bar></top-bar></div><div class=off-canvas-wrapper><div ap-off-canvas class=position-left id=offCanvas data-off-canvas data-transition=overlap><navigation></navigation></div><div class=off-canvas-content data-off-canvas-content><div ap-message-container></div><div id=content class=\"row medium-12 large-11 columns\"><div ng-view></div></div></div></div><ap-confirm-modal></ap-confirm-modal></div>");
  $templateCache.put("components/crud/directives/list/list.template.html",
    "<div ng-if=\"list.length !== 0\"><div ng-transclude></div><ap-pagination></ap-pagination></div><div ng-if=\"list.length === 0\" class=\"small-12 callout warning text-center\">{{noResultText}}</div>");
  $templateCache.put("components/crud/directives/list/listContainer.template.html",
    "<ap-box title={{title}}><div ng-if=newRoute class=\"row columns\"><a ng-href={{newRoute}} class=button>Nuevo</a></div><div ng-transclude=form></div><div ap-load><div class=small-12 ng-transclude=list></div></div></ap-box>");
  $templateCache.put("components/navigation/navigation.template.html",
    "<ul class=\"vertical menu\"><li ng-repeat=\"(name, item) in items\" ng-class=\"{'is-active': baseIndex === $index}\"><a href={{item.link}}>{{name}}<i class=\"fa fa-angle-down arrow-icon\"></i></a><ul ng-if=item.items class=\"vertical menu nested\"><li ng-repeat=\"(nestedItemName, nestedItemData) in item.items\" ng-class=checkRoute(nestedItemData.link)><a href={{nestedItemData.link}} ng-bind=nestedItemName></a></li></ul></li></ul>");
  $templateCache.put("components/top-bar/hamburger/hamburger.template.html",
    "<div id=hamburger-icon><span class=\"line line-1\"></span><span class=\"line line-2\"></span><span class=\"line line-3\"></span></div>");
  $templateCache.put("components/top-bar/top-bar.template.html",
    "<div class=top-bar><div class=top-bar-left><div hamburger></div>{{title}}</div><div class=logout title=\"cerrar sesión\" ng-click=clickBtn()><i class=\"fa fa-lg fa-sign-out-alt\"></i></div></div>");
  $templateCache.put("directives/accordion/accordion.template.html",
    "<div ng-if=addButtonText class=\"row column\"><button type=button class=\"button secondary\" ng-click=addElement() ng-bind=addButtonText></button></div><div class=accordion ng-transclude></div>");
  $templateCache.put("directives/accordion/accordionItem.template.html",
    "<div class=accordion-top><button type=button class=accordion-title ng-click=toggleTab() ng-bind=title></button><div class=accordion-button><button type=button ng-if=deleteButton class=\"button alert\" ng-click=deleteElement()><i class=\"fa fa-times\"></i></button></div></div><div class=accordion-content data-tab-content ng-transclude></div>");
  $templateCache.put("directives/boxes/box/box.template.html",
    "<div class=card ng-if=!isHide><button ng-if=closeButton class=close-button type=button ng-click=close()><span>&times;</span></button><div class=card-divider ng-if=title><h1 ng-bind=title></h1></div><div class=card-section><div ng-if=message class=\"message-container callout\" ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\"><h5 ng-if=message.title><i ng-if=\"message.type === 'error'\" class=\"fa fa-exclamation-triangle\"></i><span ng-bind=\"' {{message.title}}'\"></span></h5><p ng-if=!isArray(message.message) ng-bind=message.message></p><ul ng-if=isArray(message.message)><li ng-repeat=\"item in message.message track by $index\" ng-bind=item></li></ul></div><div ng-transclude ap-load></div></div></div>");
  $templateCache.put("directives/boxes/boxState/boxState.template.html",
    "<div class=\"card details-container\" ng-class=\"{'cursor-not-allowed' : state === 'hideContent' || state === 'noEditable', 'cursor-pointer' : state === 'noContent'}\" ng-mouseover=onMouseOver($event) ng-mouseleave=onMouseLeave($event)><div class=card-divider>{{title}}<i ng-if=state class=\"fa {{message.icon}} title-icon\"></i></div><div class=card-section><div><div ng-if=\"mouseOver && state\" class=\"callout message-container\"><h5><i class=\"fa {{message.icon}} medium\"></i>&nbsp; {{message.text}}</h5><p ng-bind=helpMessage></p></div><div ng-class=\"{'hide-content' : state === 'hideContent'}\"><div ng-if=\"!state || state === 'hideContent'\" ng-transclude></div></div></div></div></div>");
  $templateCache.put("directives/dataSelect/dataSelect.template.html",
    "<label>{{label}}<div class=data-select-wrapper><div class=input-group><input class=input-group-text-field type=text ng-model=input.model ng-change=onChangeInput() ng-focus=onFocusInput() ng-blur=onBlurInput() ng-disabled=disabled><div class=input-group-button><button type=button class=\"button secondary\" ng-click=onClickButton() ng-mousedown=onMousedownButton($event) ng-disabled=disabled tabindex=-1><span class=caret></span></button></div></div><div class=dropdown ng-class=\"{'is-open': lista.desplegado, 'medium-6 columns': itemDetailsData}\"><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && lista.items.length > 0\" class=list-group><li ng-repeat=\"option in lista.items\" ng-bind-html=\"option.name | highlight:input.model\" ng-mousedown=\"onClickItemList($event, option)\" ng-mouseover=\"onOverItemList($event, option)\" ng-class=\"{'active':option.$$object.id === itemSelected.$$object.id}\"></li></ul><ul ng-if=\"!loading && lista.items.length === 0\" class=list-group><li style=font-weight:700>No hay resultados</li></ul><ul ng-if=enableNewButton class=\"list-group new\"><li ng-mousedown=newObject($event)><span class=\"fa fa-plus\"></span>&nbsp;<span>Nuevo</span></li></ul></div><div class=\"medium-6 columns\" ng-if=lista.desplegado ng-class=\"{'medium-6 columns': itemDetailsData}\"><label ng-repeat=\"item in itemDetailsData\">{{item[0]}}<span class=\"input readonly\" type=text ng-bind=\"{{ ('itemOver.' + item[1]) + item[2]}}\"></span></label></div></div></label>");
  $templateCache.put("directives/datePicker/datePicker.template.html",
    "<label>{{label}}<div class=\"input-group ap-datepicker\"><span class=\"input-group-label prefix\"><i class=\"far fa-calendar-alt\"></i></span><input class=\"input-group-field date\" type=text readonly></div></label>");
  $templateCache.put("directives/dateTimePicker/dateTimePicker.template.html",
    "<label>{{label}}<div class=\"input-group ap-datetimepicker\"><span class=\"input-group-label prefix\"><i class=\"far fa-calendar-alt\"></i></span><input class=\"input-group-field date\" type=text readonly><span class=input-group-label>Hs</span><input class=input-group-field type=number style=width:60px ng-model=hours ng-change=changeHour()><span class=input-group-label>Min</span><input class=input-group-field type=number style=width:60px ng-model=minutes ng-change=changeMinute()></div></label>");
  $templateCache.put("directives/fileSaver/fileSaver.template.html",
    "<button class=button type=button><i ng-hide=loading class=\"fa fa-download\"></i><div ng-show=loading class=animation><div style=width:100%;height:100% class=lds-rolling><div></div></div></div><span class=text ng-bind=buttonName></span></button>");
  $templateCache.put("directives/filter/filter.template.html",
    "<ul class=\"accordion filtros\" data-accordion data-allow-all-closed=true><li class=accordion-item data-accordion-item><a href=# class=accordion-title><i class=\"fa fa-filter fa-lg\"></i>&nbsp; Filtros</a><div class=accordion-content data-tab-content ng-transclude></div></li></ul>");
  $templateCache.put("directives/form/form.template.html",
    "<form name=form novalidate ng-model-options=\"{updateOn: 'default blur'}\"><div class=\"alert callout ng-hide\" ng-show=\"form.$invalid || errorData.errors\"><h5><i class=\"fa fa-exclamation-triangle\"></i>&nbsp;El formulario contiene errores</h5><ul ng-if=errorData.errors><li ng-repeat=\"error in errorData.errors track by $index\" ng-bind=error></li></ul></div><div></div><span ng-click=scroll(formId) class=submit-button><input type=submit validation-submit=form ng-click=submit() class=button value={{submitButtonValue}} title=\"Guardar datos\"></span><button ng-if=\"cancel && !hideCancelButton\" ng-click=cancel() class=\"button secondary\" title=Cancelar>Cancelar</button></form>");
  $templateCache.put("directives/imageLoader/imageLoader.template.html",
    "<div class=image-view><img ng-src={{image.path}} ng-click=loadImage()></div><div class=input-group><div class=input-group-button><label for=exampleFileUpload class=\"button file\"><i class=\"fa fa-file-image-o\"></i></label><input type=file id=exampleFileUpload class=show-for-sr accept=image/*></div><input class=input-group-field type=text readonly ng-value=image.name></div>");
  $templateCache.put("directives/load/load.template.html",
    "<div ng-show=loading class=ap-load-image><img ng-src={{path}}></div><div ng-hide=loading class=ap-load-content><div ng-if=message class=callout ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\" ng-bind=message.message></div><div></div></div>");
  $templateCache.put("directives/load/loadingImg.template.html",
    "<img ng-src={{path}}>");
  $templateCache.put("directives/magellan/magellan.template.html",
    "<div class=\"card magellan\"><div class=card-divider><h1 ng-bind=title></h1></div><div class=magellan-body><ul class=\"menu vertical\"><li ng-repeat=\"(key, value) in items\"><a href=\"\" ap-go-to-anchor={{value}} ng-bind=key></a></li></ul></div></div>");
  $templateCache.put("directives/messages/message.template.html",
    "<div class=ap-message ng-class=message.type><div ng-bind=message.message></div><button class=close-button type=button ng-click=remove()><span>&times;</span></button></div>");
  $templateCache.put("directives/messages/messagesContainer.template.html",
    "<div class=row><div ng-repeat=\"message in messageList\" class=small-12 ap-message message=message></div></div>");
  $templateCache.put("directives/modals/confirm/confirmModal.template.html",
    "<div class=reveal data-reveal><h1 ng-bind=title></h1><p class=lead ng-bind=text></p><div class=button-group><a class=\"button alert\" ng-click=yes()>Aceptar</a><a class=\"button secondary\" ng-click=no()>Cancelar</a></div><button class=close-button data-close aria-label=\"Close modal\" type=button><span aria-hidden=true>&times;</span></button></div>");
  $templateCache.put("directives/modals/modal/modal.template.html",
    "<div class=\"ng-modal ng-hide\" ng-show=show><div class=reveal-overlay><div class=\"reveal-overlay ng-modal-bg\" ng-click=hideModal()></div><div class=reveal><div ng-transclude></div><div ng-if=dialogButtons class=float-right><button class=\"button secondary\" ng-click=hideModal()>Cancelar</button><button class=button ng-class=confirmButtonType ng-click=confirm() data-close>Confirmar</button></div><button class=close-button ng-click=hideModal() aria-label=\"Close modal\" type=button><span aria-hidden=true>&times;</span></button></div></div></div>");
  $templateCache.put("directives/msfCoordenadas/msfCoordenadas.template.html",
    "<div class=\"row column\"><div class=\"callout secondary text-center\">Podés obtener los datos de<u><a href=https://www.santafe.gov.ar/idesf/servicios/generador-de-coordenadas/tramite.php target=_blank>acá</a></u></div></div><div class=\"row column\"><label ng-class=\"{'is-invalid-label':error}\"><input style=margin-bottom:3px type=text ng-class=\"{'is-invalid-input':error}\" ng-model=coordenadas ng-change=cambioCoordeandas()><span ng-class=\"{'is-visible':error}\" style=margin-top:7px class=form-error>El campo ingresado contiene errores.</span></label></div><div class=row><div class=\"columns small-12 large-6\"><label>Latitud <input type=text ng-value=model.latitud readonly></label></div><div class=\"columns small-12 large-6\"><label>Longitud <input type=text ng-value=model.longitud readonly></label></div></div>");
  $templateCache.put("directives/numberInput/numberInput.template.html",
    "<label>{{label}}<div class=input-group><span class=input-group-label ng-if=previousLabel ng-bind=previousLabel></span><input class=input-group-field type=number ng-model=ngModel ng-attr-min={{min}} ng-attr-max={{max}} ng-attr-step={{step}} placeholder={{placeholder}} ng-change=updateModel()></div></label>");
  $templateCache.put("directives/pagination/pagination.template.html",
    "<ul class=\"pagination text-center\" role=navigation ng-if=\"pagination.pages.length !== 0\"><li ng-if=pagination.activeLastFirst class=pagination-previous ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.changePage(1)></a></li><li ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.previousPage()>&lsaquo;</a><span ng-if=!pagination.enablePreviousPage>&lsaquo;</span></li><li ng-repeat=\"page in pagination.pages track by $index\" ng-class=\"{'current':page === pagination.currentPage}\"><a ng-if=\"page !== pagination.currentPage\" ng-bind=page ng-click=pagination.changePage(page)></a><span ng-if=\"page === pagination.currentPage\" ng-bind=page></span></li><li ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.nextPage()>&rsaquo;</a><span ng-if=!pagination.enableNextPage>&rsaquo;</span></li><li ng-if=pagination.activeLastFirst class=pagination-next ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.changePage(pagination.pageCount)></a></li></ul>");
  $templateCache.put("directives/select/select.template.html",
    "<label>{{label}}<div class=select-wrapper><div class=input-group><input class=input-group-text-field type=text ng-model=selectedValue ng-change=onChangeInput() ng-focus=onFocusInput() ng-blur=onBlurInput() ng-disabled=loading autocomplete=off><div class=input-group-button><button type=button class=\"button secondary\" ng-click=onClickButton() ng-mousedown=onMousedownButton($event) tabindex=-1><span class=caret></span></button></div></div><div class=dropdown ng-class=\"{'is-open':list.displayed}\"><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && list.options.length > 0\" class=list-group><li ng-repeat=\"option in list.options\" ng-bind-html=\"option | selectOption | highlight:selectedValue\" ng-mousedown=\"onClickItemList($event, option)\" ng-class=\"{'active':option === selectedValue}\"></li></ul><ul ng-if=\"!loading && list.options.length === 0\" class=list-group><li style=font-weight:700>No hay opciones disponibles</li></ul></div></div></label>");
  $templateCache.put("directives/selectMultiple/selectMultiple.template.html",
    "<label>{{label}}</label><ul class=list-group><li ng-repeat=\"value in selectedValues\" class=list-group-item><span class=list-group-item-text ng-bind=value></span><button type=button class=\"button secondary\" ng-click=onClickRemoveButton(value)><i class=\"fa fa-minus medium\"></i></button></li></ul><div class=input-group><input class=input-group-field type=text ng-model=searchValue ng-change=onChangeInput() ng-focus=onFocusInput() ng-blur=onBlurInput() ng-disabled=loading autocomplete=off placeholder=Buscar...><div class=input-group-button><button type=button class=\"button secondary\" ng-click=onClickAddButton() ng-mousedown=onMousedownButton($event)><i class=\"fa fa-plus medium\"></i></button></div></div><div class=\"dropdown-pane dropdown\" ng-class=\"{'is-open':list.displayed}\"><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && list.options.length > 0\" class=list-group><li ng-repeat=\"option in list.options | filter:searchValue\" ng-bind-html=\"option | highlight:searchValue\" ng-mousedown=\"onClickItemList($event, option)\" ng-class=\"{'disabled': selectedValues.indexOf(option) >= 0}\"></li></ul><ul ng-if=\"!loading && list.options.length === 0\" class=list-group><li style=font-weight:700>No hay opciones disponibles</li></ul></div>");
  $templateCache.put("directives/stepByStep/stepByStep.template.html",
    "<ul class=steps ng-transclude></ul>");
  $templateCache.put("directives/switch/switch.template.html",
    "<label ng-bind=label></label><div class=switch><input class=switch-input name={{name}} id={{name}} type=checkbox ng-model=ngModel ng-change=updateModel()><label class=switch-paddle for={{name}}></label></div>");
  $templateCache.put("directives/tabs/tab.template.html",
    "<div ng-show=isVisible()><div class=\"tabs-panel is-active\" ng-if=wasOpened() ng-transclude></div></div>");
  $templateCache.put("directives/tabs/tabs.template.html",
    "<div><div class=tabs-wrapper><button type=button class=\"arrow-button float-left\" ng-mousedown=scrollToLeft() ng-mouseup=mouseUp() ng-show=\"enableScrollButtons && allowScrollToLeft\"><i class=\"fa fa-chevron-left\"></i></button><button type=button class=\"arrow-button float-right\" ng-mousedown=scrollToRight() ng-mouseup=mouseUp() ng-show=\"enableScrollButtons && allowScrollToRight\"><i class=\"fa fa-chevron-right\"></i></button><ul class=tabs><li class=tabs-title ng-repeat=\"tab in tabs\" ng-click=switch(tab) id=\"{{'tab-' + tab.name}}\"><a class={{tab.state}} aria-selected=\"{{tab.name === active}}\" title={{tab.title}}>{{ tab.title }}&nbsp;<i ng-if=tab.endIcon class=\"fa fa-{{tab.endIcon}}\"></i></a></li></ul></div><div class=tabs-content ng-transclude></div></div>");
  $templateCache.put("directives/textInput/textInput.template.html",
    "<label>{{label}} <input type=text ng-model=ngModel maxlength={{maxlength}} placeholder={{placeholder}} ng-change=updateModel()></label>");
  $templateCache.put("directives/textarea/textarea.template.html",
    "<label>{{label}}<div class=text-area-wrapper><textarea type=text ng-model=ngModel maxlength={{maxlength}} placeholder={{placeholder}} ng-change=updateModel() ng-class=\"{'has-button' : helpInfo}\">\n" +
    "        </textarea><button ng-if=helpInfo class=\"button secondary tiny\" title=\"Información adicional\" ap-show-modal={{modalId}}><i class=\"fa fa-info medium animate\"></i></button></div></label><div ng-if=helpInfo><ap-modal id={{modalId}}><h1 ng-bind=\"label ? label : 'Información de ayuda'\"></h1><p ng-bind=helpInfo></p></ap-modal></div>");
  $templateCache.put("directives/timePicker/timePicker.template.html",
    "<div class=input-group><span class=input-group-label>Hs</span><input class=input-group-field type=number ng-model=hours ng-change=changeHour()><span class=input-group-label>Min</span><input class=input-group-field type=number ng-model=minutes ng-change=changeMinute()></div>");
}]);
