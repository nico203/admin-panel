angular.module('adminPanel').directive('apInfoOnTablea', [
    function(){
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                console.log('apInfoOnTable',elem);
            },
            templateUrl: 'directives/infoOnTable/infoOnTable.template.html'
        };
    }
]);
