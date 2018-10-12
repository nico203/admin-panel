/**
 * @description Atributo que se coloca en un elemento para que
 *              actue como botón que redirecciona a una parte
 *              específica del documento.
 *
 *  Ejemplo de uso:
 *  <ul class="menu vertical">
 *      <li><a href="" ap-go-to-anchor="elem1Id">Go to element 1</a></li>
 *      <li><a href="" ap-go-to-anchor="elem2Id">Go to element 2</a></li>
 *  </ul>
 *  Attrs:
 *      - ap-go-to-anchor: Id del elemento donde se va a colocar la pantalla.
 */
angular.module('adminPanel').directive('apGoToAnchor',[
    '$timeout', '$document',
    function($timeout, $document) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {

                scope.options = {
                    duration: 500,
                    offest: 60,
                    easing: function (t) {
                        return t;
                    }
                };

                element.bind("click", function(e) {
                    var element = angular.element(document.getElementById(attrs.apGoToAnchor));
                    if (element) {
                        $timeout( function () {
                            $document.scrollToElement(
                                element,
                                scope.options.offest,
                                scope.options.duration,
                                scope.options.easing
                            ).then(
                                function() {
                                    //El scroll fue realizado con éxito
                                },
                                function() {
                                    //El scroll falló, posiblemente porque otro fue iniciado
                                }
                            );
                        });
                    }
                });
            }
        };
    }
]);