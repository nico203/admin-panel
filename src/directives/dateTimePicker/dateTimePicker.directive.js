angular.module('adminPanel').directive('apDateTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datetimepicker');
            scope.hours = 0;
            scope.minutes = 0;
            scope.date = new Date();
            var options = {
                format: 'dd/mm/yyyy',
//                pickTime: true,
                initialDate: scope.date
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            function changeDateTime(date, hours, minutes) {
                var h = (hours !== null || hours !== undefined) ? hours : scope.hours;
                var m = (minutes !== null || minutes !== undefined ) ? minutes : scope.minutes;
                date.setSeconds(0);
                
                date.setHours(h);
                date.setMinutes(m);
                $timeout(function() {
                    scope.$apply(function(){
                        
                        ngModel.$setViewValue(date);
                    });
                }, 100);
            }
            
            $(elem.find('.ap-date')).fdatepicker(options)
                    .on('changeDate', function(ev){
                scope.date = ev.date;
                scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                changeDateTime(scope.date, null, null);
            });
            
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
            
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
        templateUrl: 'components/admin-panel/directives/dateTimePicker/dateTimePicker.template.html'
    };
}]);
