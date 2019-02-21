angular.module('adminPanel').directive('apMessage', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            require: '?^apMessageContainer',
            scope: {
                message: '='
            },
            link: function(scope, elem, attr, apMessageContainerCtrl) {
                scope.remove = function() {
                    if(apMessageContainerCtrl) {
                        apMessageContainerCtrl.removeMessage(scope.message);
                    }
                };
                
                $timeout(function() {
                   scope.remove();
                }, 5000);
            },
            templateUrl: 'directives/messages/message.template.html'
        };
    }
]);