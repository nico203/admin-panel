/**
 * @description Elemento que agrupa contenido. Características:
 *  -   Utiliza el componente card de foundation.
 *  -   No usa la directiva ap-load del admin-panel.
 *  -   Se le puede indicar el título del card.
 *  -   Se le puede indicar un estado.
 *
 *  Attrs:
 *      - title: Título del card
 *      - state: Posibles valores:
 *          - 'hideContent' : Muestra un mensaje indicando que el usuario no cuenta con los permisos para ver el contenido.
 *          - 'noContent' : Muestra un mensaje indicando que el contenedor está vacío.
 *          - 'noEditable' : Muestra un mensaje indicando que el usuario no cuenta con los permisos para editar el contenido.
 */
angular.module('adminPanel').directive('apBoxState', [
    function() {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                title: '@',
                state: '<',
                helpMessage: '@'
            },
            link: function($scope, element, attr, ctrl, transclude) {
                
                $scope.title = $scope.title ? $scope.title : '';
                $scope.state = $scope.state ? $scope.state : '';
                $scope.helpMessage = $scope.helpMessage ? $scope.helpMessage : '';
                $scope.mouseOver = false;

                $scope.message = {
                    text: '',
                    icon: ''
                };

                /**
                 * Watcher que actualiza el estado
                 */
                $scope.$watch('state', function(newValue, oldValue) {
                    
                    switch (newValue) {
                        case 'hideContent':
                            $scope.message = {
                                text: 'No tiene permisos para ver este contenido.',
                                icon: 'fa-eye-slash'
                            };
                            break;
                        case 'noContent':
                            $scope.message = {
                                text: 'No hay datos cargados.',
                                icon: 'fa-minus-circle'
                            };
                            break;
                        case 'noEditable':
                            $scope.message = {
                                text: 'No tiene permisos para editar este contenido.',
                                icon: 'fa-times-circle'
                            };
                            break;
                        default :
                            $scope.message = {
                                text: '',
                                icon: ''
                            };
                            break;
                    }
                });

                /**
                 * Evento usado para mostrar mensaje
                 */
                $scope.onMouseOver = function (e) {
                    $scope.mouseOver = true;
                };

                /**
                 * Evento usado para ocultar mensaje
                 */
                $scope.onMouseLeave = function (e) {
                    $scope.mouseOver = false;
                };
            },
            templateUrl: 'directives/boxes/boxState/boxState.template.html'
        };
    }
]);