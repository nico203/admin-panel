angular.module('adminPanel', [
    'ngAnimate',
    'adminPanel.authentication',
    'adminPanel.crud',
    'adminPanel.topBar',
    'adminPanel.navigation',
    'adminPanel.filters',
    'adminPanel.utils'
]).directive('adminPanel', [
    function() {
        return {
            restrict: 'E',
            templateUrl: 'admin-panel.template.html'
        };
    }
]).run([
    'WindowResize','$timeout',
    function (WindowResize,$timeout) {
        WindowResize.init();
    }
]);