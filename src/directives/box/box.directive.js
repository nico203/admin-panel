//Mirar el componente cars de foundation

//Ver de sacar el isolated scope asi se puede usar scope broadcast en este elemento

angular.module('adminPanel').directive('apBox', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'AE',
            priority: 100,
//        terminal: true,
            transclude: true,
            scope: {
                title: '@',
                init: '&?'
            },
            compile: function (elem, attr) {
                elem.addClass('ap-box');

                //Link function
                return function (scope, elem, attr) {
                    //El boton de cierre del box se muestra solamente si tiene seteado 
                    //el atributo name, el cual debe ser el nombre del evento que lo muestra.
                    scope.closeButton = (typeof (attr.name) !== 'undefined');
                    scope.message = null;
                    scope.elem = elem;
//                    scope.isHide = false;
                    scope.isHide = scope.closeButton;

                    //Ejecutada al ingresar el mouse al elemento. Aplica la clase para iluminar el box
                    function onMouseEnter() {
                        scope.elem.removeClass('no-visible');
                        $rootScope.$broadcast('box.directive.mouseenter', scope.elem);
                    }

                    //Funcion ejecutada al ingresar el mouse a otro box en la pantalla
                    function onMouseEnterInOtherBox(e, elem) {
                        if (scope.elem === elem) {
                            return;
                        }
                        scope.elem.addClass('no-visible');
                    }

                    //Funcion que se usa para mostrar el box al lanzar determinado 
                    //evento con el nombre determinado para el box
                    function showOnEvent(e, name) {
                        if (attr.name === name) {
                            scope.isHide = false;
                        }
                    }

                    //Funcion ejecutada para cerrar el box
                    scope.close = function () {
                        scope.isHide = true;
                    };

                    elem.on('mouseenter', onMouseEnter);
                    var onMouseEnterInOtherBoxDestructor = scope.$on('box.directive.mouseenter', onMouseEnterInOtherBox);
                    var showOnEventDestructor = scope.$on('apBox:show', showOnEvent);
                    var destroyEventDestructor = scope.$on('$destroy', function () {
                        //Unbind events
                        elem.off('mouseenter', onMouseEnter);
                        onMouseEnterInOtherBoxDestructor();
                        showOnEventDestructor();
                        destroyEventDestructor();
                    });

                    if (scope.init) {
                        scope.init();
                    }
                };
            },
            templateUrl: 'directives/box/box.template.html'
        };
    }
]);
