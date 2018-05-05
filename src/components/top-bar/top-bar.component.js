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
                
                var toggleClickElement = function(e) {
                    $('#offCanvas').foundation('toggle');
                    return false;
                };
                
                var removeActiveClass = function() {
                    $('#hamburger-icon').removeClass('active');
                    return false;
                };
                
                var addActiveClass = function() {
                    $('#hamburger-icon').addClass('active');
                    return false;
                };
                
                elem.on('click', toggleClickElement);
                $(document).on('closed.zf.offcanvas', removeActiveClass);
                $(document).on('opened.zf.offcanvas', addActiveClass);
                
                scope.$on('$destroy', function() {
                    $(document).off('closed.zf.offcanvas', removeActiveClass);
                    $(document).off('opened.zf.offcanvas', addActiveClass);
                    elem.off('click', toggleClickElement);
                });
            },
            templateUrl: 'components/top-bar/hamburger/hamburger.template.html'
        };
    }
]);