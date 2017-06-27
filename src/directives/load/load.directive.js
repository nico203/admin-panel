angular.module('adminPanel').directive('apLoad', function(){
    return {
        restrict: 'A',
        transclude: true,
        scope: {},
        link: function(scope, elem, attr) {
            elem.addClass('ap-load');
            scope.loading = false;
            
            scope.show = function(message) {
                scope.loading = false;
                scope.message = message;
            };
            
            scope.hide = function() {
                scope.loading = true;
            };
            
            scope.$on('apLoad:finish', function(e, message) {
                scope.show(message);
            });
            scope.$on('apLoad:start', function() {
                scope.hide();
            });
        },
        controller: ['$scope', function($scope) {
            this.show = function(message) {
                $scope.show(message);
            };
            
            this.hide = function() {
                $scope.hide();
            };
        }],
        templateUrl: 'directives/load/load.template.html'
    };
});
