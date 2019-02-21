angular.module('adminPanel').directive('fieldErrorMessages', [
    function() {
        return {
            restrict: 'E',
            scope: {
                errors: '='
            },
            link: function(scope, elem) {
                elem.addClass('form-error');
                console.log('fieldErrorMessages',scope);
            },
            templateUrl: 'directives/form/fieldErrorMessages.template.html'
        };
    }
]);

