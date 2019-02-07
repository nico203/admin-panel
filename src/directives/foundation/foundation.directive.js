/**
 * @description Directiva que inicializa Foundation en el elemento. Útil para
 *              inicializar componentes básicos de foundation, como por ejemplo
 *              los dropdowns.
 * 
 *              Ejemplo de uso:
 *                  <div ap-foundation></div>
 */
angular.module('adminPanel').directive('apFoundation', [
    '$timeout',
    function($timeout) {
        return {
            restrict: 'A',
            scope: {},
            link: function(scope, element) {
                element.foundation();
            }
        };
    }
]);