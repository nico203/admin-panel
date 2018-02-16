angular.module('adminPanel').directive('apInfo', [
    function(){
        return {
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr) {
                var self = this;
                //es el puntero al DOM elem que se quiere manipular
                scope.targetElem = null;
                //el boton se inicializa como cerrado
                //false = cerrado | true = abierto
                scope.currentState = false;
                
                
                self.init = function() {
                    //ubicamos el elemento abajo del parent en otra fila de la tabla
                    var trParent = elem.closest('tr');
                    var colspan = trParent.find('td').length - 1;
                    
                    //ubicamos el elemento que queremos mover
                    var container = trParent.find('[ap-info-on-table=""]');
                    //le agregamos el colspan para que la cantidad de filas sea la necesaria para esta fila sea fullwidth
                    container.attr('colspan',colspan);
                    
                    //extraemos el contenido
                    var contents = container.contents();
                    
                    //envolvemos el contenido en un div para que tengan efecto las transiciones y lo inicializamos oculto
                    scope.targetElem = angular.element('<div>')
                            .addClass('ap-info-on-table')
                            .append(contents)
                            .hide();
                    
                    //envolvemos el targetElem en nuestro contenedor
                    container.append(scope.targetElem);
                    container.addClass('no-padding');
                    
                    //envolvemos el container en un tr y lo agregamos despues del tr actual, quedando como un elemento mas de la tabla
                    trParent.after(angular.element('<tr>')
                            .append(container));
                };
                
                self.toggleButton = function() {
                    scope.currentState = !scope.currentState;
                    scope.targetElem[scope.currentState ? 'slideDown' : 'slideUp'](500);
                    elem[scope.currentState ? 'addClass' : 'removeClass']('open');
                };
                
                elem.on('click', self.toggleButton);
                
                scope.$on('$destroy', function() {
                    elem.off('click', self.toggleButton);
                });
                
                self.init();
            },
            templateUrl: 'directives/infoOnTable/info.template.html'
        };
    }
]);
