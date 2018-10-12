/**
 * @description Muestra una lista de pasos.
 *
 *  Ejemplo de uso:
 *  <ap-step-by-step>
 *      <li>First Step</li>
 *      <li class="active">Current Step</li>
 *      <li class="disabled">Next Step</li>
 *  </ap-step-by-step>
 *
 *  Clases:
 *      - expanded even-N: Hace que la lista ocupe todo el ancho posible.
 *        Usar expanded y even-N juntos. Reemplazar N por cantidad de elementos <li>
 *      - vertical: Muestra la lista de pasos en forma vertical
 *      - round: aplica border-radius
 */
angular.module('adminPanel').directive('apStepByStep',[
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {},
            link: function($scope, elem, attr) {
            },
            templateUrl: 'directives/stepByStep/stepByStep.template.html'
        };
    }
]);