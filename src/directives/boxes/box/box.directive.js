/**
 * @description Elemento que agrupa contenido. Ver componente card de foundation.
 * Attrs:
 *      - title: Título del card
 *      - init: Función que se ejecuta al inicializar el componente.
 */
angular.module('adminPanel').directive('apBox', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'AE',
            priority: 100,
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
                    scope.isHide = scope.closeButton;
                    scope.showOnEventSource = null;

                    attr.$observe('title', function(val) {
                        scope.title = val;
                    });

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
                    //evento con el nombre determinado para el box. Si name es un
                    //objeto se usa el atributo destination de name y se guarda el
                    //valor source de name.
                    function showOnEvent(e, name) {
                        if (angular.isUndefined(name) || name === null) {
                            return;
                        }
                        if (attr.name === name) {
                            scope.isHide = false;
                        } else if (typeof name === 'object' && attr.name === name.destination) {
                            scope.isHide = false;
                            scope.showOnEventSource = name.source; 
                        }
                    }

                    //Funcion que se usa para ocultar el box al lanzar determinado
                    //evento con el nombre determinado para el box. Si name es un
                    //objeto se usa el atributo destination de name y se emite un
                    //evento llamado '' con los datos de name.data
                    function hideOnEvent(e, name) {
                        if (angular.isUndefined(name) || name === null) {
                            return;
                        }
                        if (attr.name === name) {
                            scope.isHide = true;
                        } else if (typeof name === 'object' && attr.name === name.destination) {
                            scope.isHide = true;
                            if (name.data) {
                                $rootScope.$broadcast('select:loadSelectedData', {
                                    destination: scope.showOnEventSource,
                                    data: name.data
                                });
                            }
                        }
                    }

                    //Funcion ejecutada para cerrar el box
                    scope.close = function () {
                        $rootScope.$broadcast('apBox:hide', attr.name);
                    };

                    elem.on('mouseenter', onMouseEnter);
                    var onMouseEnterInOtherBoxDestructor = scope.$on('box.directive.mouseenter', onMouseEnterInOtherBox);
                    var showOnEventDestructor = scope.$on('apBox:show', showOnEvent);
                    var hideOnEventDestructor = scope.$on('apBox:hide', hideOnEvent);
                    var destroyEventDestructor = scope.$on('$destroy', function () {
                        //Unbind events
                        elem.off('mouseenter', onMouseEnter);
                        onMouseEnterInOtherBoxDestructor();
                        showOnEventDestructor();
                        hideOnEventDestructor();
                        destroyEventDestructor();
                    });

                    if (scope.init) {
                        scope.init();
                    }
                };
            },
            templateUrl: 'directives/boxes/box/box.template.html'
        };
    }
]);
