angular.module('adminPanel').directive('apAppendInfo', [
    function(){
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                console.log('apAppendInfo',elem);
                var appendElem = elem.find('[ap-info-on-table=""]');
                var container = angular.element('<tr>');
                container.append(appendElem);
                elem.after(container);
            },
            controller: ['$scope',
                function($scope) {
                    $scope.fn = function() {
                        
                    };
                }
            ]
        };
    }
]);
