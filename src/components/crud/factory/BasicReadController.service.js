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
                var action = (actionDefault) ? actionDefault : 'get';
                return self.$$crudFactory.doRequest(action, params).then(function(responseSuccess) {
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