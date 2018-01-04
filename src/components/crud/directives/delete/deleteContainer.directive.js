/**
 * Recibe un objeto configuracion por el nombre
 * Object {
 *    resource: obligatorio, es el resource para hacer el delete,
 *    text: texto que se muestra al eliminar un objeto de este tipo
 *    title: titulo del modal. 
 * }
 * 
 */
angular.module('adminPanel.crud').directive('apDeleteContainer',[
    'CrudConfig',
    function(CrudConfig) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                //creamos el watcher para ver cuando varia el elemento que se pasa como parametro
                scope.$watch(attr.apDeleteContainer, function(cfg) {
                    scope.text = angular.isUndefined(cfg.text) ? CrudConfig.messages.deleteMsg : cfg.text;
                    scope.title = angular.isUndefined(cfg.title) ? CrudConfig.messages.deleteTitle : cfg.title;
                });
                
                /**
                 * @param {type} elem Objeto que se va a eliminar
                 * @returns {Function} funcion a ser ejecutada por el confirm Modal
                 */
                function deleteFuncntion(elem) {
                    
                    return function() {
                        scope.$emit('ap-delete-elem:list-ctrl', elem);
                    };
                }
                scope.fn = deleteFuncntion;
            },
            controller: [
                '$rootScope','$scope',
                function($rootScope,$scope) {
                    this.deleteElem = function(elem) {
                        $rootScope.$broadcast('ap-confirm-modal:show', {
                            title: $scope.title,
                            text: $scope.text,
                            fn: $scope.fn(elem)
                        });
                    };
                }
            ]
        };
    }
]);