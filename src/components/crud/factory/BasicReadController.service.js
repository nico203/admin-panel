/**
 * Servicio para obtener los datos de una entidad en especifico desde un servidor
 * 
 * FALTA implementar los resultados en base a un hijo
 */
angular.module('adminPanel.crud').factory('BasicReadController', [
    'CrudService',
    function(CrudService) {
        
        /**
         * @description 
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         */
        function BasicReadController(scope, resource, apLoadName) {
            this.crudService = CrudService(scope, resource, apLoadName);
            
            this.get = function(params, actionDefault, callbackSuccess, callbackError) {
                var paramRequest = (params) ? params : {};
                
                this.crudService.doRequest('get', paramRequest, function(responseSuccess) {
                    
                }, function(responseError) {
                    
                });
                
                return this;
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
                this.crudService.cancelRequest();
            };
        }
        
        return BasicReadController;
    }
]);