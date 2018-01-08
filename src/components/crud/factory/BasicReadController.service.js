/**
 * Servicio para obtener los datos de una entidad en especifico desde un servidor
 * 
 * FALTA implementar los resultados en base a un hijo
 */
angular.module('adminPanel.crud').factory('BasicReadController', [
    'CrudFactory', '$q',
    function(CrudFactory, $q) {
        
        /**
         * @description 
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         */
        function BasicReadController(scope, resource, apLoadName) {
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource, apLoadName);
            
            self.get = function(params, actionDefault) {
                var paramRequest = (params) ? params : {};
                
                var action = (actionDefault) ? actionDefault : 'get';
                
                return self.$$crudFactory.doRequest(action, paramRequest).then(function(responseSuccess) {
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
            self.init = function(id) {
                var obj = {};
                obj[resource.name] = id;
                return self.get(obj);
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                self.$$crudFactory.cancelRequest();
            };
        }
        
        return BasicReadController;
    }
]);