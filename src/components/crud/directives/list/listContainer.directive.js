angular.module('adminPanel.crud').directive('apListContainer',[
    function(){
        return {
            restrict: 'AE',
            scope: {
                title: '@',
                newRoute: '@?'
            },
            transclude: {
                list: 'list',
                form: '?searchForm'
            },
            templateUrl: 'components/crud/directives/list/listContainer.template.html'
        };
    }
]);
