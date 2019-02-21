angular.module('adminPanel').directive('apDatePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datepicker');
            scope.date = null;
            var options = {
                format: 'dd/mm/yyyy'
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                }
            });
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeDate(date) {
                
                //cambio hecho al terminar el ciclo $digest actual
                $timeout(function() {
                    scope.$apply(function(){
                        ngModel.$setViewValue(date);
                    });
                });
            }
            
            //Se inicializa el componente fdatepicker en la vista y se le asigna un eventListener para
            //detectar cuando se cambia la hora
            $(elem.find('.ap-date')).fdatepicker(options)
                    .on('changeDate', function(ev){
                scope.date = ev.date;
                scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                changeDate(scope.date);
            });
            
        },
        templateUrl: 'directives/datePicker/datePicker.template.html'
    };
}]);
