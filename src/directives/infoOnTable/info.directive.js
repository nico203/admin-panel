angular.module('adminPanel').directive('apInfo', [
    '$timeout',
    function($timeout){
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                var self = this;
                
                //el boton se inicializa como cerrado
                //false = cerrado | true = abierto
                scope.currentState = false;
                scope.apInfoOnTableController = null;
                
                //se usa la funcion timeout para que se ejectue ultimo esta funcion, cuando ya todos los objetos hayan sido compilados
                self.init = function() {
                    $timeout(function() {
                        //ubicamos el elemento abajo del parent en otra fila de la tabla
                        var trParent = elem.closest('tr');
                        var colspan = trParent.find('td').length - 1;

                        //ubicamos el elemento que queremos mover
                        var apInfoOnTableDirective = trParent.find('[ap-info-on-table=""]');
                        
                        scope.apInfoOnTableController = apInfoOnTableDirective.controller('apInfoOnTable');
                        scope.apInfoOnTableController.setColspan(colspan);

                        //envolvemos el container en un tr y lo agregamos despues del tr actual, quedando como un elemento mas de la tabla
                        trParent.after(angular.element('<tr>')
                                .append(apInfoOnTableDirective));
                    });
                    
                };
                
                self.toggleButton = function() {
                    scope.currentState = !scope.currentState;
                    elem.find('.ap-info')[scope.currentState ? 'addClass' : 'removeClass']('open');
                    scope.apInfoOnTableController.toggleElem();
                };
                
                elem.on('click', self.toggleButton);
                
                scope.$on('$destroy', function() {
                    elem.off('click', self.toggleButton);
                });
                
                self.init();
            },
            template: '<div class="ap-info"></div>'
        };
    }
]);
