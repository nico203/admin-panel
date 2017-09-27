angular.module('adminPanel').directive('apImageLoader', [
    function(){
        return {
            require: 'ngModel',
            restrict: 'E',
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-image-loader');
                
                scope.imagePath = null;
                
                scope.$watch(function() {
                    return ngModel.$modelValue;
                }, function(val) {
                    console.log('val image', val);
                    scope.imagePath = val;
                });
            },
            controller: ['$scope',function($scope) {

            }]
        };
    }
]);
