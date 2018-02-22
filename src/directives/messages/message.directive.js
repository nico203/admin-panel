angular.module('adminPanel').directive('apMessage', [
    function() {
        return {
            restrict: 'A',
            require: '?^apMessageContainer',
            scope: {
                message: '='
            },
            link: function(scope, elem, attr, apMessageContainerCtrl) {
                
            },
            templateUrl: 'directives/messages/message.template.html'
        };
    }
]);