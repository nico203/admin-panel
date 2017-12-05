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
            this.crudFactory = CrudFactory(scope, resource, apLoadName);
            
            this.get = function(params, actionDefault) {
                var paramRequest = (params) ? params : {};
                
                var action = (actionDefault) ? actionDefault : 'get';
                
                return this.crudFactory.doRequest(action, paramRequest).then(function(responseSuccess) {
                    return responseSuccess;
                }, function(responseError) {
                    $q.reject(responseError);
                });
            };
            
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicReadController}
             */
            this.init = function() {
                this.get();
                return this;
            };
            
            //cancelamos los request al destruir el controller
            this.destroy = function() {
                this.crudFactory.cancelRequest();
            };
        }
        
        return BasicReadController;
    }
]);