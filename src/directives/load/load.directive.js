angular.module('adminPanel').directive('apLoad', [
    '$animate', '$compile',
    function($animate, $compile){
    return {
        restrict: 'A',
        priority: 50,
        link: function(scope, elem, attr) {
            //controla que no haya una directiva ap-load en sus elementos hijos
            var name = attr.apLoad;
            if (elem.find("[ap-load='" + name + "']").length !== 0) {
                return;
            }

            scope.name = (name) ? name : 'default';
            elem.addClass('ap-load');
            var img = angular.element('<ap-loading-img>');
            elem.append(img);
            $compile(img)(scope);

            scope.show = function () {
                $animate.removeClass(elem, 'loading');
            };

            scope.hide = function () {
                $animate.addClass(elem, 'loading');
            };

            var startEventDestructor = scope.$on('apLoad:start', function(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                scope.hide();
            });
            var finishEventDestructor = scope.$on('apLoad:finish', function(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                scope.show();
            });

            var destroyEventDestructor = scope.$on('$destroy', function () {
                startEventDestructor();
                finishEventDestructor();
                destroyEventDestructor();
            });
        },
        controller: ['$scope',function($scope) {

            this.getName = function() {
                console.log('getName',$scope.name);
                return $scope.name;
            };

            this.show = function() {
                $scope.show();
            };

            this.hide = function() {
                $scope.hide();
            };

        }]
    };
}
]);
