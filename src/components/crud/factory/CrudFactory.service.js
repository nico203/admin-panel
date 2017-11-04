angular.module('adminPanel.crud').factory('CrudFactory', [
    'CrudConfig',
    function(CrudConfig) {
        /**
         * VER POSIBILIDAD DE devolver el callback en el finnally de la promise
         * 
         * @param {type} $scope
         * @param {type} resource
         * @param {type} apLoadName
         * @returns {CrudFactory.serviceL#3.CrudFactory}
         */
        function CrudFactory($scope, resource, apLoadName) {
            this.request = null;

            this.doRequest = function (methodName, paramRequest, successMsg, errorMsg) {
                //emitimos el evento de carga, anulamos la vista actual y mostramos el gif de carga
                $scope.$emit('apLoad:start',apLoadName);
                
                //Si hay un request en proceso se lo cancela
                this.cancelRequest();
                
                //se procesa el request
                this.request = resource.$resource[methodName](paramRequest);
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
                    $scope.$broadcast('apLoad:finish',apLoadName, message);
                    
                    return responseSuccess;
                }, function(responseError) {
                    console.log('responseError', responseError);
                    
                    var message = {
                        message: (typeof(errorMsg) === 'string') ? errorMsg : CrudConfig.messages.loadError,
                        type: 'success'
                    };
                    
                    //se muestra el error, 
                    $scope.$emit('apLoad:finish', apLoadName, message);
                    
                    return responseError;
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
