angular.module('adminPanel').directive('apLoadingImg', ['AdminPanelConfig', 
    function(AdminPanelConfig){
        return {
            restrict: 'AE',
            priority: 60,
            link: function(scope, elem) {
                elem.addClass('ap-load-image');
                scope.path = AdminPanelConfig.imgLoadingRsc;
            },
            templateUrl: 'directives/load/loadingImg.template.html'
        };
    }
]);
