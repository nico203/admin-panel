angular.module('adminPanel').directive('apInfoOnTable', [
    function(){
        return {
            restrict: 'A',
            priority: 1000,
            transclude: true,
            link: function(scope, elem, attr) {
                //false = cerrado | true = abierto
                scope.currentState = false;
                
                elem.addClass('no-padding');
                
                //buscamos el contenedor del elemento 
                scope.container = elem.find('.ap-info-on-table');
                scope.container.hide();
                
                scope.toggleElem = function() {
                    scope.currentState = !scope.currentState;
                    scope.container[scope.currentState ? 'slideDown' : 'slideUp'](500, function() {
                        scope.$apply();
                    });
                };
            },
            controller: [
                '$scope','$element',
                function($scope,$element) {
                    this.toggleElem = function() {
                        $scope.toggleElem();
                    };
                    
                    this.setColspan = function(colspan) {
                        $element.attr('colspan',colspan);
                    };
                    
                }
            ],
            template: '<div class="ap-info-on-table"><div ng-if="currentState"><div ng-transclude></div></div></div>'
        };
    }
]);
