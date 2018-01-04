angular.module('adminPanel').directive('apList',[
    function(){
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                list: '='
            },
            link: function(scope) {
                scope.noResultText = 'No hay resultados';
            },
            templateUrl: 'components/crud/directives/list/list.template.html'
        };
    }
]);
