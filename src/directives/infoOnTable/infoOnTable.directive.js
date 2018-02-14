angular.module('adminPanel').directive('apInfoOnTable', [
    function(){
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                console.log('apInfoOnTable',elem);
            },
            templateUrl: 'directives/infoOnTable/infoOnTable.template.html'
        };
    }
]);
