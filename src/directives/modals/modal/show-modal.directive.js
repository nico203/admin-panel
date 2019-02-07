/**
 * @description Atributo para abrir ap-modals.
 *
 *  Ejemplo de uso:
 *  <a class="tiny button" ap-show-modal="modalId1"><i class="fa fa-info medium animate"></i></a>
 *  <a class="tiny button" ap-show-modal="modalId2"><i class="fa fa-info medium animate"></i></a>
 *  <ap-modal id="modalId1">
 *      <p class="lead">Este modal se abre con el primer botón.</p>
 *  </ap-modal>
 *  <ap-modal id="modalId2">
 *      <p class="lead">Este modal se abre con el segundo botón.</p>
 *  </ap-modal>
 *  Attrs:
 *      - ap-show-modal: Id del modal que se va a abrir al hacer click en el elemento.
 */
angular.module('adminPanel').directive('apShowModal',[
    '$rootScope',
    function($rootScope) {
        return {
            restrict: 'A',
            link: function(scope , element, attrs) {
                element.bind("click", function(e) {
                    $rootScope.$broadcast("showModal", {id: attrs.apShowModal});
                });
            }
        };
    }
]);