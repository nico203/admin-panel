/**
 * @description Modal con clase Reveal de foundation.
 *
 *  Ejemplo de uso:
 *  <a class="tiny button" ap-show-modal="modalId"><i class="fa fa-info medium animate"></i></a>
 *  <ap-modal id="modalId" dialog-buttons confirm-button-type="alert">
 *      <h4>Título de Modal</h4>
 *      <p class="lead">Contenido del modal.</p>
 *  </ap-modal>
 *
 *  Attrs:
 *      - dialog-buttons: Hace que se muestren dos botones en el modal:
 *        "confirmar" y "cancelar". El botón "confirmar" hace que se emita un evento
 *        con nombre "modalConfirm", enviando como dato el ID del modal.
 *      - confirm-button-type: Permite asignarle el estilo al botón de "confirmar"
 *        cuando la opción "dialog-buttons" esta activa. Las opciones son:
 *        "primary", "secondary", "success", "alert", "warning".
 *      - id: id del elemento, lo usa el botón un otro elemento que tenga la directiva
 *        ap-show-modal para saber qué modal abrir.
 */
angular.module('adminPanel').directive('apModal',[
    '$timeout',
    function($timeout) {
        return {
            restrict: 'E',
            priority: 60,
            transclude: true,
            scope: {
                id: '@'
            },
            link: function(scope, element, attrs) {
                
                //Inicializar foundation
                var htmlElem = element.find('.reveal');
                $timeout(function() {
                    htmlElem.foundation();
                });

                //Inicializar variables del scope
                scope.dialogButtons = angular.isUndefined(attrs.dialogButtons) ? false : true;
                scope.confirmButtonType = attrs.confirmButtonType;

                scope.hideModal = function() {
                    htmlElem.foundation('close');
                };

                scope.showModal = function() {
                    htmlElem.foundation('open');
                };

                //Evento disparado al presionar el botón confirmar
                scope.confirm = function() {
                    scope.$emit('modalConfirm', {id: scope.id});
                    scope.hideModal();
                };

                //Event listener para abrir el modal
                scope.$on("showModal", function (event, data) {
                    if (data.id === scope.id) {
                        scope.showModal();
                    }
                });

                //Event listener 2 para abrir el modal
                scope.$on('apBox:show', function showOnEvent(e, name) {
                    if (name === scope.id) {
                        scope.showModal();
                    }
                });
            },
            templateUrl: 'directives/modals/modal/modal.template.html'
        };
    }
]);