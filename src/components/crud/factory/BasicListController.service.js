/* 
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
            self.list = function(params, action) {
                self.listParams = (params) ? params : {};
                var promise = null;
                
                return $timeout(function () {
                    self.action = action || 'get';
                    
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
            
            self.delete = function (elem, action) {
                action = action || 'delete';
                var obj = {};
                obj[resource.name] = elem.id;
                Object.assign(obj, self.listParams);
                return self.$$crudFactory.doRequest(action, obj).then(function () {
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

