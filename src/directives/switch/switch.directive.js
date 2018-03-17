angular.module('adminPanel').directive('apSwitch', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                id: '@',
                title: '@'
            },
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('row column');

                scope.$watch(function() {
                    return ngModel.$modelValue;
                }, function(val) {
                    if(val) {
                        var date = new Date(val);
                        scope.date = date;
                        $(elem.find('.ap-date')).fdatepicker('update', date);
                    }
                });
                
                scope.$watch('model', function(val) {
                    ngModel.$setViewValue(val);
                });
                
                //init
                $timeout(function(){
                    elem.foundation();
                });
            },
            templateUrl: 'directives/switch/switch.template.html'
        };
    }
]);
