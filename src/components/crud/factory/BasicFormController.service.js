/**
 * Obtiene los datos del servidor para ser editados. 
 * Los expone a través de un atributo definido en el $scope del componente según la propiedad 'name' de 
 * la instancia de CrudResource que se provea.
 * 
 * Si la propiedad 'name' es compuesta, es decir, es una entidad que depende de otra, se usa el campo name 
 */
angular.module('adminPanel.crud').factory('BasicFormController', [
    'CrudFactory', '$q',
    function(CrudFactory, $q) {
        function BasicFormController(scope, resource, apLoadName, formName) {
            this.$$crudFactory = new CrudFactory(scope, resource, apLoadName);
            
            var name = null;
            //Nombre con el cual se expone al formulario dentro del scope. 
            //Ver https://docs.angularjs.org/guide/forms
            formName = angular.isUndefined(formName) ? 'form' : formName;
            
            this.get = function(params, actionDefault) {
                var paramRequest = (params) ? params : {};
                
                var action = (actionDefault) ? actionDefault : 'get';
                
                return this.$$crudFactory.doRequest(action, paramRequest, '$emit').then(function(responseSuccess) {
                    console.log('responseSuccess', responseSuccess);
                    return responseSuccess;
                }, function(responseError) {
                    console.log('responseError', responseError);
                    $q.reject(responseError);
                });
            };
            
            
            
            this.submit = function() {
                var object = scope[name];
                
                //Si el formulario está expuesto y es válido se realiza la peticion para guardar el objeto
                //if(!scope.form) {} ????
                if(scope[formName] && scope[formName].$valid) {
                    console.log('object',object);
                    return this.$$crudFactory.doRequest('save', object, '$emit').then(function(responseSuccess) {
                        if(responseSuccess.data) {
                            scope[name] = responseSuccess.data;
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
            this.init = function() {
                name = (resource.property !== null) ? resource.property : resource.name;
                //inicializamos variables
                scope[name] = {};
                
                this.get();
                return this;
            };
            
            //cancelamos los request al destruir el controller
            this.destroy = function() {
                this.$$crudFactory.cancelRequest();
            };
        }
        
        return BasicFormController;
    }
]);