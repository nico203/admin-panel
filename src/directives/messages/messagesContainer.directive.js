angular.module('adminPanel').directive('apMessageContainer', [
    function() {
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                elem.addClass('row column expanded ap-message-container');
                scope.messageList = [];
                
                scope.addMessage = function(message) {
                    scope.messageList.unshift(message);
                    return this;
                };
                
                scope.removeMessage = function(message) {
                    var index = scope.messageList.indexOf(message);
                    if(index >= 0) {
                        scope.messageList.splice(index,1);
                    }
                    return this;
                };
                
                var deresgisterEventAdd = scope.$on('ap-message:create',function(e, message) {
                    scope.addMessage(message);
                });
                
                var deregisterEventDestroy = scope.$on('$destroy',function() {
                    deresgisterEventAdd();
                    deregisterEventDestroy();
                });
            },
            controller: [
                '$scope',
                function($scope) {
                    this.removeMessage = function(message) {
                        $scope.removeMessage(message);
                    };
                }
            ],
            templateUrl: 'directives/messages/messagesContainer.template.html'
        };
    }
]);