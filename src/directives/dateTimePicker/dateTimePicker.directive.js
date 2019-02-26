angular.module('adminPanel').directive('apDateTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row expanded collapse date ap-datetimepicker');
            scope.hours = null;
            scope.minutes = null;
            scope.date = null;
            var options = {
                format: 'dd/mm/yyyy'
//                pickTime: true,
//                initialDate: scope.date
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    if(isNaN(date)) return; //la fecha no es valida
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeDateTime(date, hours, minutes) {
                var h = (angular.isUndefined(hours) || hours === null) ? 
                        ((scope.hours !== null) ? scope.hours : 0) : hours;
                var m = (angular.isUndefined(minutes) || minutes === null) ?  
                        ((scope.minutes !== null) ? scope.minutes : 0) : minutes;
                date.setSeconds(0);
                date.setHours(h);
                date.setMinutes(m);
                
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
                changeDateTime(scope.date);
            });
            
            //Funcion que se ejecuta al cambiar de hora en la vista
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
            
            //Funcion que se ejecuta al cambiar de minuto en la vista
            scope.changeMinute = function() {
                if(scope.minutes < 0) {
                    scope.minutes = 0;
                }
                if(scope.minutes > 59) {
                    scope.minutes = 59;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
        },
        templateUrl: 'directives/dateTimePicker/dateTimePicker.template.html'
    };
}]);
