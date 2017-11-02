/**
 * Servicio para obtener los datos de una entidad en especifico desde un servidor
 * 
 * FALTA implementar los resultados en base a un hijo
 */
angular.module('adminPanel.crud').service('BasicReadController', [
    'CrudConfig','$timeout',
    function(CrudConfig,$timeout) {
        
        /**
         * @description 
         * 
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         */
        function BasicReadController(scope, resource, apLoadName) {
            this.request = null;
            var name = resource.name;
            
            this.get = function(params, actionDefault, callbackSuccess, callbackError) {
                var paramRequest = (params) ? params : {};
                
                //emitimos el evento de carga, anulamos la vista actual y mostramos el gif de carga
                scope.$emit('apLoad:start',apLoadName);
                
                //si hay un request en proceso se lo cancela
                if (this.request && !this.request.$promise.$resolved) {
                    this.request.$cancelRequest();
                }
                
                //se procesa el request
                this.request = resource.$resource.get(paramRequest);
                this.request.$promise.then(function(responseSuccess) {
                    //se muestra la vista original
                    scope.$broadcast('apLoad:finish',apLoadName);
                    
                    //se usa el nombre definido en el resource para establecer el nombre de la propiedad
                    scope[name] = responseSuccess.data;
                    
                    //si hay un callback en caso de exito, se lo llama y se pasa como parametro la respuesta
                    if(typeof(callbackSuccess) === 'function') {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    
                    //se muestra el error, 
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.loadError,
                        type: 'error'
                    });
                    
                    //si hay un callback en caso de error, se lo llama y se pasa como parametro la respuesta
                    if (typeof (callbackError) === 'function') {
                        callbackError(responseError);
                    }
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
                if(this.request) {
                    this.request.$cancelRequest();
                }
            };
        }
        
        return BasicReadController;
    }
]);