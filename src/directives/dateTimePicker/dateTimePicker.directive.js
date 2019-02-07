angular.module('adminPanel').directive('apDateTimePicker', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                
                scope.hours = null;
                scope.minutes = null;
                scope.date = null;
                scope.label = scope.label ? scope.label : '';

                var options = {
                    format: 'dd/mm/yyyy',
                    language: 'es'
                };

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
                $(elem.find('.date')).fdatepicker(options)
                        .on('changeDate', function(ev){
                    scope.date = ev.date;
                    scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                    changeDateTime(scope.date);
                });

                //Funcion que se ejecuta al cambiar de hora en la vista
                scope.changeHour = function() {
                    if (typeof scope.hours === 'undefined') {
                        return;
                    }
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
                    if (typeof scope.minutes === 'undefined') {
                        return;
                    }
                    if(scope.minutes < 0) {
                        scope.minutes = 0;
                    }
                    if(scope.minutes > 59) {
                        scope.minutes = 59;
                    }
                    changeDateTime(scope.date, scope.hours, scope.minutes);
                };

                /**
                 * Evento disparado cuando cambia el valor del modelo y la vista necesita actualizarse.
                 */
                ngModel.$render = function() {
                    if(ngModel.$modelValue) {
                        var date = new Date(ngModel.$modelValue);
                        if(isNaN(date)) {
                            return; //la fecha no es valida
                        }
                        scope.date = date;
                        $(elem.find('.date')).fdatepicker('update', date);
                        scope.hours = date.getHours();
                        scope.minutes = date.getMinutes();
                    } else {
                        $(elem.find('input')).val(null);
                    }
                };
            },
            templateUrl: 'directives/dateTimePicker/dateTimePicker.template.html'
        };
    }
]);
