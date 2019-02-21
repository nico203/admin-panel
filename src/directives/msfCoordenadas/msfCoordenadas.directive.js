angular.module('adminPanel').directive('msfCoordenadas', [
    '$timeout',
    function($timeout) {
    return {
        require: 'ngModel',
        restrict: 'E',
        link: function(scope, elem, attr, ngModel) {
            scope.coordenadas = '';
            scope.error = false;
            
            //init function
            $timeout(function() {
                if(angular.isUndefined(ngModel.$modelValue)) {
                    ngModel.$modelValue = {
                        latitud: null,
                        longitud: null
                    };
                    console.log('ngModel.$modelValue',ngModel.$modelValue);
                }
                scope.model = {
                    latitud: angular.copy(ngModel.$modelValue.latitud),
                    longitud: angular.copy(ngModel.$modelValue.longitud)
                };
            });
            
            //actualizacion externa
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    scope.model = {
                        latitud: angular.copy(ngModel.$modelValue.latitud),
                        longitud: angular.copy(ngModel.$modelValue.longitud)
                    };
                }
            });
            
            scope.cambioCoordeandas = function() {
                var latitud = false, longitud = false;
                scope.error = false;
                
                //validacion
                var latRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var lngRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var splits = [',', ':', ' ', '.'];
                
                for(var i = 0; i < splits.length; i++) {
                    var arr = scope.coordenadas.replace(/\s+/g, '').split(splits[i]);
                    if (arr.length === 2) {
                        latitud = parseFloat( arr[0].replace(',', '.').match(latRegex) );
                        longitud = parseFloat( arr[1].replace(',', '.').match(lngRegex) );
                    } else if (arr.length === 4) {
                        latitud = parseFloat( (arr[0] + '.' + arr[1]).match(latRegex) );
                        longitud = parseFloat( (arr[2] + '.' + arr[3]).match(lngRegex) );
                    }
                }
                if(!latitud || !longitud //||
//                        latitud < -31.99 || latitud > -31 ||
//                        longitud < -61.99 || longitud > -60.3
                    ){
                    scope.model.latitud = '';
                    scope.model.longitud = '';
                    scope.error = true;
                    return;
                }
                scope.model.latitud = latitud;
                scope.model.longitud = longitud;
                ngModel.$setViewValue({
                    latitud: latitud,
                    longitud: longitud
                });
                
                scope.$emit('msfCoordenadas:change', this);
            };
        },
        templateUrl: 'directives/msfCoordenadas/msfCoordenadas.template.html'
    };
}]);
