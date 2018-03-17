angular.module('adminPanel').directive('apChoice', [
    '$timeout', '$rootScope', '$q', '$injector',
    function ($timeout, $rootScope, $q, $injector) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                items: '='
            },
            link: function (scope, elem, attr, ngModel) {
                
            },
            templateUrl: 'directives/choice/choice.template.html'
        };
    }
]);
