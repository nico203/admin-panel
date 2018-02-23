/**
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
    'CrudConfig', '$q', '$rootScope', 'AudioService',
    function(CrudConfig, $q, $rootScope, AudioService) {
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
                AudioService.play();      
                
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
