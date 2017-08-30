angular.module('adminPanel').directive('apTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-timepicker');
            scope.hours = null;
            scope.minutes = null;
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            
            //Funcion que realiza el cambio de la hora en el modelo
            function changeTime(hours, minutes) {
                var h = (hours === null) ? 
                        ((scope.hours !== null) ? scope.hours : 0) : hours;
                var m = (minutes === null) ?  
                        ((scope.minutes !== null) ? scope.minutes : 0) : minutes;
                
                var date = new Date();
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
            
            //Funcion que se ejecuta al cambiar de hora en la vista
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeTime(scope.hours, scope.minutes);
            };
            
            //Funcion que se ejecuta al cambiar de minuto en la vista
            scope.changeMinute = function() {
                if(scope.minutes < 0) {
                    scope.minutes = 0;
                }
                if(scope.minutes > 59) {
                    scope.minutes = 59;
                }
                changeTime(scope.hours, scope.minutes);
            };
        },
        templateUrl: 'directives/timePicker/timePicker.template.html'
    };
}]);
