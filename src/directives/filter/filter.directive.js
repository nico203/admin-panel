angular.module('adminPanel').directive('apFilters',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            transclude: true,
            link: function(scope, elem, attr) {
                var accordionElem = null;

                $timeout(function() {
                    
                    accordionElem = elem.find('.accordion.filtros');
                    console.log('elem',accordionElem);
                    accordionElem.foundation();
                });
                
                scope.$on('$destroy', function() {
                    accordionElem.foundation('_destroy');
                });
            },
            templateUrl: 'directives/filter/filter.template.html'
        };
    }
]);