/**
 * Servicio para obtener los datos de una entidad en especifico desde un servidor
 *
 * FALTA implementar los resultados en base a un hijo
 */
angular.module('adminPanel.crud').factory('BasicReadController', [
    'CrudFactory', 'CrudConfig', '$q',
    function(CrudFactory, CrudConfig, $q) {

        /**
         * @description
         *
         * @param {Scope} scope Scope del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         */
        function BasicReadController(scope, resource) {
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource);

            self.get = function(params, actionDefault) {
                var deferred = $q.defer();
                var validRequest = true;

                if(angular.isUndefined(params[resource.name]) || params[resource.name] === null || params[resource.name] === CrudConfig.newPath) {
                    deferred.reject(false);
                    validRequest = false;
                }
                var paramRequest = params;

                var action = (actionDefault) ? actionDefault : 'get';

                var promise = null;
                if(validRequest) {
                    promise = self.$$crudFactory.doRequest(action, paramRequest).then(function(responseSuccess) {
                        scope[resource.name] = responseSuccess.data;

                        return responseSuccess;
                    }, function(responseError) {
                        return $q.reject(responseError);
                    });
                }
                deferred.resolve(promise);

                return deferred.promise;
            };


            /**
             * @description Inicializa el controlador dado un identificador del objeto a obtener
             *
             * @returns {BasicReadController}
             */
            self.init = function(id, action) {
                var obj = {};
                obj[resource.name] = id;
                return self.get(obj, action);
            };

            //cancelamos los request al destruir el controller
            self.destroy = function() {
                self.$$crudFactory.cancelRequest();
            };
        }

        return BasicReadController;
    }
]);