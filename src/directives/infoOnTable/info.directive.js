angular.module('adminPanel').directive('apInfo', [
    function(){
        return {
            restrict: 'A',
            priority: 100,
            link: function(scope, elem, $attr) {
                var self = this;
                //es el puntero al DOM elem que se quiere manipular
                self.targetElem = null;
                //el boton se inicializa como cerrado
                //false = cerrado | true = abierto
                self.currentState = false;
                
                elem.on('click', function(){
                    self.currentState = !self.currentState;
                    elem[self.currentState ? 'addClass' : 'removeClass']('open');
                });
                
                //init
                
                //ubicamos el elemento abajo del parent en otra fila de la tabla
                var trParent = elem.closest('tr');
                var colspan = trParent.find('td').length - 1;
                self.targetElem = trParent.find('[ap-info-on-table=""]');
                var container = angular.element('<tr>').append(self.targetElem);
                self.targetElem.attr('colspan',colspan);
                trParent.after(container);
                
                
            },
            controller: ['$scope',
                function($scope) {
                    $scope.fn = function() {
                        
                    };
                }
            ]
        };
    }
]);
