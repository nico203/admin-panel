function topBarController($scope, AuthenticationService, $location) {
    $scope.clickBtn = function() {
        AuthenticationService.logout();
        $location.path('/login');
    };
    
    this.$postLink = function() {
        $('top-bar').foundation();
    };
}

angular.module('adminPanel.topBar', [
    'adminPanel.authentication'
]).component('topBar', {
    templateUrl: 'components/top-bar/top-bar.template.html',
    controller: ['$scope', 'AuthenticationService', '$location', topBarController]
}).directive('hamburger', [
    '$timeout',
    function ($timeout) {
        return {
            restrict: 'AE',
            link: function (scope, elem, attr) {
                elem.addClass('hambruger-wrapper');
                
                var toggleClickElement = function() {
                    $('#offCanvas').foundation('open');
                    $('#hamburger-icon').toggleClass('active');
                    return false;
                };
                
                elem.on('click', toggleClickElement);
                $(document).on('closed.zf.offcanvas', toggleClickElement);
                
                scope.$on('$destroy', function() {
                    $(document).off('closed.zf.offcanvas', toggleClickElement);
                    elem.off('click', toggleClickElement);
                });
            },
            templateUrl: 'components/top-bar/hamburger/hamburger.template.html'
        };
    }
]);