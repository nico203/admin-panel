/**
 * @description Directiva que muestra un ícono de font-awesome dependiendo del MIME type
 *              que recibe.
 * 
 *              Ejemplo de uso:
 *                  <ap-file-icon type={{"image/png"}} fa-prefix="far" fa-size="fa-2x"></ap-file-icon>
 */
angular.module('adminPanel').directive('apFileIcon', [
    function() {
        return {
            restrict: 'E',
            scope: {
                type: '<',
                faPrefix: '@',
                faSize: '@'
            },
            link: function(scope) {
                scope.faPrefix = scope.faPrefix ? scope.faPrefix : 'fas';
                scope.faSize = scope.faSize ? scope.faSize : '';
                scope.iconClass = function() {
                    return scope.faPrefix + ' ' + scope.faSize;
                };
                if (!scope.type) {
                    return;
                }
                var typeArray = scope.type.split('/');
                if (typeArray[0] && typeArray[0] == 'audio') {
                    scope.type = 'audio';
                } else if (typeArray[0] && typeArray[0] == 'video') {
                    scope.type = 'video';
                } else if (typeArray[0] && typeArray[0] == 'image') {
                    scope.type = 'image';
                } else if (scope.type == 'application/vnd.oasis.opendocument.text' || scope.type == 'application/rtf' || scope.type == 'text/plain') {
                    scope.type = 'text';
                } else if (scope.type == 'application/x-rar-compressed' || scope.type == 'application/zip' || scope.type == 'application/x-7z-compressed') {
                    scope.type = 'compressed';
                }
            },
            templateUrl: 'src/directives/fileIcon/fileIcon.template.html'
        };
    }
]);