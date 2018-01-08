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
            var self = this;
            self.$$crudFactory = new CrudFactory(scope, resource, apLoadName);
            
            var name = (resource.property !== null) ? resource.property : resource.name;
            
            //Nombre con el cual se expone al formulario dentro del scope. 
            //Ver https://docs.angularjs.org/guide/forms
            self.$$form = angular.isUndefined(formName) ? 'form' : formName;
            
            
            self.get = function(params, actionDefault) {
                var paramRequest = (params) ? params : {};
                
                var action = (actionDefault) ? actionDefault : 'get';
                
                return self.$$crudFactory.doRequest(action, paramRequest).then(function(responseSuccess) {
                    scope[name] = responseSuccess.data;
                    
                    return responseSuccess;
                }, function(responseError) {
                    return $q.reject(responseError);
                });
            };
            
            
            
            self.submit = function(actionDefault) {
                var object = scope[name];
                
                console.log('self.$$form',self.$$form);
                var action = (actionDefault) ? actionDefault : 'save';
              
                //Si el formulario está expuesto y es válido se realiza la peticion para guardar el objeto
                //if(!scope.form) {} ????
                if(scope[self.$$form] && scope[self.$$form].$valid) {
                    console.log('object',object);
                    return self.$$crudFactory.doRequest(action, object, '$emit').then(function(responseSuccess) {
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
            self.init = function(id, action) {
                
                //inicializamos variables
                var obj = {};
                obj[name] = id;
                console.log('obj', obj);
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