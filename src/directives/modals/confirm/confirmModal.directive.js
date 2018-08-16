/**
 * Al evento 'ap-confirm-modal:show' se deben pasar 3 valores:
 * {
 *   title: titulo del modal,
 *   text: texto a mostrar,
 *   fn: function a realizar en caso de ser verdadera
 * }
 */

angular.module('adminPanel').directive('apConfirmModal', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'AE',
            priority: 60,
            link: function(scope, elem) {
                var htmlElem = elem.find('.reveal');
                var fnToRealize = null;
                
                //init
                $timeout(function() {
                    htmlElem.foundation();
                });

                scope.yes = function() {
                    if(fnToRealize !== null) {
                        fnToRealize();
                    }
                    htmlElem.foundation('close');
                };
                
                scope.no = function() {
                    htmlElem.foundation('close');
                };
                
                scope.$on('ap-confirm-modal:show', function(e, data) {
                    scope.title = data.title;
                    scope.text = data.text;
                    
                    fnToRealize = angular.isFunction(data.fn) ? data.fn : null;
                    
                    $timeout(function() {
                        htmlElem.foundation('open');
                    });
                });
            },
            templateUrl: 'directives/modals/confirm/confirmModal.template.html'
        };
    }
]);
