/**
 * Obtiene los datos del servidor para ser editados. 
 * Los expone a través de un atributo definido en el $scope del componente según la propiedad 'name' de 
 * la instancia de CrudResource que se provea.
 * 
 * Si la propiedad 'name' es compuesta, es decir, es una entidad que depende de otra, se usa el campo name 
 */
angular.module('adminPanel.crud').factory('BasicFormController', [
    'CrudFactory', 'CrudConfig',  '$q',
    function(CrudFactory,CrudConfig, $q) {
        function BasicFormController(scope, resource, formName) {
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource);
            
            //Nombre con el cual se expone al formulario dentro del scope. 
            //Ver https://docs.angularjs.org/guide/forms
            self.$$form = angular.isUndefined(formName) ? 'form' : formName;
            
            
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
            
            
            
            self.submit = function(actionDefault) {
                var object = scope[resource.name];
                if(resource.parent !== null) {
                    object[resource.parent] = scope[resource.parent];
                }

                var action = (actionDefault) ? actionDefault : 'save';
              
                //Si el formulario está expuesto y es válido se realiza la peticion para guardar el objeto
                //if(!scope.form) {} ????
                if(scope[self.$$form] && scope[self.$$form].$valid) {
                    return self.$$crudFactory.doRequest(action, object).then(function(responseSuccess) {
                        if(responseSuccess.data) {
                            scope[resource.name] = responseSuccess.data;
                        }
                        return responseSuccess;
                    }, function(responseError) {
                        $q.reject(responseError);
                    });
                }
            };
            
            /**
             * @description Inicializa el controlador
             * 
             * @returns {BasicReadController}
             */
            self.init = function(id, action) {
                
                //inicializamos variables
                var obj = {};
                obj[resource.name] = id;
                
                return self.get(obj, action);
            };
            
            //cancelamos los request al destruir el controller
            self.destroy = function() {
                this.$$crudFactory.cancelRequest();
            };
        }
        
        return BasicFormController;
    }
]);