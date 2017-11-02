/* 
 * Servicio para listar todos los elementos 
 * 
 * FALTA implementar los resultados en base a un hijo
 * 
 * FALTA implementar busqueda
 */
angular.module('adminPanel.crud').service('BasicListController', [
    'CrudConfig','$timeout',
    function(CrudConfig,$timeout) {
        
        /**
         * @description Lista los objetos de una entidad. Si la respuesta desde el servidor es de la forma 
         * object: {
         *    totalItemCount: 'numero total de entidades en el servidor',
         *    pageNumber: 'Numero de la pagina actual'
         * }
         * implementa paginacion sobre los elementos devueltos.
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         */
        function BasicListController(scope, resource, apLoadName) {
            scope.list = [];
            this.request = null;
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicListController}
             */
            this.init = function () {
                this.list();
                return this;
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
            this.list = function(params, actionDefault, callbackSuccess, callbackError) {
                var listParams = (params) ? params : {};
                
                $timeout(function () {
                    //se muestra el gif de carga
                    scope.$broadcast('apLoad:start',apLoadName);
                    var action = (typeof(actionDefault) === 'string') ? actionDefault : 'get';
                    
                    //si hay un request en proceso se lo cancela
                    if(this.request && !this.request.$promise.$resolved) {
                        this.request.$cancelRequest();
                    }
                    
                    //se procesa el request
                    this.request = resource.$resource[action](listParams);
                    this.request.$promise.then(function(responseSuccess) {
                        //se muestra la vista original
                        scope.$broadcast('apLoad:finish',apLoadName);
                        
                        //se listan las entidades obtenidas del request
                        scope.list = responseSuccess.data;
                        
                        //se envia el evento para paginar, si es que la respuesta contiene los datos para paginacion
                        scope.$broadcast('pagination:paginate', {
                            totalPageCount: responseSuccess.totalPageCount,
                            currentPageNumber: responseSuccess.currentPageNumber
                        });
                        
                        //si hay un callback en caso de exito, se lo llama y se pasa como parametro la respuesta
                        if(typeof(callbackSuccess) === 'function') {
                            callbackSuccess(responseSuccess);
                        }
                    }, function(responseError) {
                        if(responseError.status === -1) return;
                        
                        //se muestra el error, 
                        scope.$broadcast('apLoad:finish',apLoadName, {
                            message: CrudConfig.messages.loadError,
                            type: 'error'
                        });
                        
                        //si hay un callback en caso de error, se lo llama y se pasa como parametro la respuesta
                        if(typeof(callbackError) === 'function') {
                            callbackError(responseError);
                        }
                    });
                });
                
                return  this;
            };
            
            //cancelamos los request al destruir el controller
            this.destroy = function() {
                if(this.request) {
                    this.request.$cancelRequest();
                }
            };
            
            //Evento capturado cuando se listan las entidades
            scope.$on('pagination:changepage', function(e, page) {
                e.stopPropagation();
                this.list({
                    page: page
                });
            });
        }
        
        return BasicListController;
    }
]);

