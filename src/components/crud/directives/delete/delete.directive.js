angular.module('adminPanel.crud').directive('apDelete',[
    function() {
        return {
            restrict: 'A',
            require: '^^apDeleteContainer',
            link: function(scope, elem, attr, ctrl) {
                var data = null;
                
                //creamos el watcher para ver cuando varia el elemento que se pasa como parametro
                scope.$watch(attr.apDelete, function(val) {
                    data = val;
                });
                
                function clickElem() {
                    //si hay un objeto se envia al container
                    if(data !== null && !angular.isUndefined(data)) {
                        ctrl.deleteElem(data);
                    }
                }
                
                elem.on('click', clickElem);
                
                scope.$on('$destroy', function() {
                    elem.off('click', clickElem);
                });
            }
        };
    }
]);