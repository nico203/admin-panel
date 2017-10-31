/* 
 * Servicio para listar todos los elementos 
 */

angular.module('adminPanel.crud').service('BasicListController', [
    'CrudConfig','$timeout',
    function(CrudConfig,$timeout) {
        
        /**
         * @description Inicializa el controlador del componente para listar entidades del servidor
         * 
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {undefined}
         */
        function BasicListController(scope, resource, apLoadName) {
            scope.list = [];
            var request = null;
            
            /**
             * Inicializa el controlador
             * 
             * @returns {BasicListController}
             */
            this.init = function () {
                this.list();
                
                return this;
            };
            
            this.list = function(params, actionDefault, callbackSuccess, callbackError) {
                var listParams = (params) ? params : {};
                
                $timeout(function () {
                    //se muestra el gif de carga
                    scope.$broadcast('apLoad:start',apLoadName);
                    var action = (actionDefault) ? actionDefault : 'get';
                    
                    //si hay un request en proceso se lo cancela
                    if(request && !request.$promise.$resolved) {
                        request.$cancelRequest();
                    }
                    
                    //se procesa el request
                    request = resource.$resource[action](listParams);
                    request.$promise.then(function(responseSuccess) {
                        //se muestra la vista original
                        scope.$broadcast('apLoad:finish',apLoadName);
                        
                        //se listan las entidades obtenidas del request
                        scope.list = r.data;
                        
                        //se envia el evento para paginar, si es que la respuesta contiene los datos para paginacion
                        scope.$broadcast('pagination:paginate', {
                            totalPageCount: r.totalPageCount,
                            currentPageNumber: r.currentPageNumber
                        });
                        
                        //si hay un callback en caso de exito, se lo llama y se pasa como parametro la respuesta
                        if(callbackSuccess) {
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
                        if(callbackError) {
                            callbackError(responseError);
                        }
                    });
                    
                    //aregamos el request al scope para poderlo cancelar
                    scope.request = request;
                });
            };
            
            //cancelamos los request al destruir el controller
            this.destroy = function() {
                if(scope.request) {
                    scope.request.$cancelRequest();
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
    }
]);

