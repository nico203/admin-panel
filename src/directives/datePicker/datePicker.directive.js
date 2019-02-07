angular.module('adminPanel').directive('apDatePicker',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                label: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                scope.label = scope.label ? scope.label : '';
                scope.date = null;

                var options = {
                    format: 'dd/mm/yyyy',
                    language: 'es'
                };

                //Funcion que realiza el cambio de la hora en el modelo
                function changeDate(date) {
                    //cambio hecho al terminar el ciclo $digest actual
                    $timeout(function() {
                        scope.$apply(function() {
                            ngModel.$setViewValue(date);
                        });
                    });
                }

                //Se inicializa el componente fdatepicker en la vista y se le asigna un eventListener para
                //detectar cuando se cambia la hora
                $(elem.find('.date')).fdatepicker(options).on('changeDate', function(ev) {
                    scope.date = ev.date;
                    scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                    changeDate(scope.date);
                });

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
                    } else {
                        $(elem.find('input')).val(null);
                    }
                };
            },
            templateUrl: 'directives/datePicker/datePicker.template.html'
        };
    }
]);
