//Mirar el componente cars de foundation

angular.module('adminPanel').directive('apBox', ['$rootScope',function($rootScope){
    return {
        restrict: 'AE',
        transclude: true,
        scope: {
            title: '@',
            closeButton: '=?',
            closeIf: '=?',
            init: '&?'
        },
        link: function(scope, elem, attr) {
            elem.addClass('ap-box');
            scope.closeIf = false;
            scope.elem = elem;
//            scope.top = false;
            
            scope.close = function() {
                scope.closeIf = true;
            };
            
            elem.on('mouseenter', function() {
//                scope.top = false;
                scope.elem.removeClass('no-visible');
                $rootScope.$broadcast('box.directive.mouseenter', scope.elem);
            });
            
            scope.$on('box.directive.mouseenter', function(event, elem) {
                if(scope.elem === elem) {
                    return;
                }
                scope.elem.addClass('no-visible');
            });
            
            scope.$watch(function(){
                return scope.closeIf;
            }, function(val){
                if(val) {
                    elem.hide();
                } else {
                    elem.show();
                }
            });
            
            if(scope.init) {
                scope.init();
            }
        },
        templateUrl: 'components/admin-panel/directives/box/box.template.html'
    };
}]);
