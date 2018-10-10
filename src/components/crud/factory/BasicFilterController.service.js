/**
 * Controlador para filtros de tablas.
 */
angular.module('adminPanel.crud').factory('BasicFilterController', [
    '$location',
    function($location) {
        function BasicFilterController($scope) {
            var self = this;

            /**
             * @description Actualiza la ruta y emite un evento con los datos del formulario
             * 
             * @param transform Función que transforma los datos antes de aplicar el filtro (opcional)
             */
            self.filter = function(transform) {
                if (transform) {
                    transform($scope.filtros);
                }
                $location.search($scope.filtros);
                $scope.$emit('filter', angular.copy($scope.filtros));
            };
            
            /**
             * @description Limpia el formulario y emite un evento
             */
            self.clear = function() {
                $scope.filtros = {
                    exclusiveSearch: true
                };
                self.filter();
            };
            
            /**
             * @description Inicializa el controlador
             * 
             * @param transform Función que inicializa los datos del filtro (opcional)
             * @returns {BasicFilterController}
             */
            self.init = function(transform) {
                $scope.filtros = angular.isDefined($location.search()) ? $location.search() : {};
                $scope.filtros.exclusiveSearch = true;
                
                if (transform) {
                    transform($scope.filtros);
                }
                
                self.filter();
                return self;
            };
        }
        
        return BasicFilterController;
    }
]);