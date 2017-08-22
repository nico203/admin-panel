angular.module('adminPanel', [
    'ngAnimate',
    'adminPanel.authentication',
    'adminPanel.crud'
]).directive('adminPanel', [
    function() {
        return {
            restrict: 'E',
            templateUrl: 'components/admin-panel/admin-panel.template.html'
        };
    }
]);