/* 
 * Servicio para listar todos los elementos 
 * 
 * FALTA implementar los resultados en base a un hijo
 * 
 * FALTA implementar busqueda
 */
angular.module('adminPanel.crud').factory('BasicListController', [
    'CrudFactory','$timeout',
    function(CrudFactory,$timeout) {
        
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
            var self = this;
            scope.list = [];
            self.$$crudFactory = new CrudFactory(scope, resource, apLoadName);
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicListController}
             */
            self.init = function () {
                self.list();
                return self;
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
                var listParams = (params) ? params : {};
                var promise = null;
                
                $timeout(function () {
                    var action = (actionDefault) ? actionDefault : 'get';
                    
                    promise = self.$$crudFactory.doRequest(action, listParams).then(function(responseSuccess) {
                        console.log('list responseSuccess', responseSuccess);
                        
                        scope.list = responseSuccess.data;
                        
                        //se envia el evento para paginar, si es que la respuesta contiene los datos para paginacion
                        scope.$broadcast('pagination:paginate', {
                            totalPageCount: responseSuccess.totalPageCount,
                            currentPageNumber: responseSuccess.currentPageNumber
                        });
                        
                        return responseSuccess;
                    }, function (responseError) {
                        console.log('list responseError', responseError);
                        
                        return responseError;
                    });
                });
                
                return promise;
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                if(self.request) {
                    self.$$crudFactory.cancelRequest();
                }
            };
            
            //Evento capturado cuando se listan las entidades
            scope.$on('pagination:changepage', function(e, page) {
                e.stopPropagation();
                self.list({
                    page: page
                });
            });
        }
        
        return BasicListController;
    }
]);

