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
                var htmlElem = null;
                var fnToRealize = null;
                
                //init
                $timeout(function() {
                    htmlElem = new Foundation.Reveal(elem.find('.reveal'));
                    console.log('htmlElem', htmlElem);
                });
                
                scope.yes = function() {
                    if(fnToRealize !== null) {
                        fnToRealize();
                    }
                    htmlElem.$element.foundation('close');
                };
                
                scope.no = function() {
                    htmlElem.$element.foundation('close');
                };
                
                scope.$on('ap-confirm-modal:show', function(e, data) {
                    scope.title = data.title;
                    scope.text = data.text;
                    
                    fnToRealize = angular.isFunction(data.fn) ? data.fn : null;
                    
                    $timeout(function() {
                        htmlElem.$element.foundation('open');
                    });
                });
            },
            templateUrl: 'directives/modals/confirm/confirmModal.template.html'
        };
    }
]);
