/**
 * @description Filtro que resalta una frase de un texto.
 * 
 * @param {String} input Texto que contiene la frase que será resaltada.
 * @param {String} phrase Frase a resaltar.
 * @returns {Object}
 */
angular.module('adminPanel.filters').filter('highlight', [
    '$sce',
    function ($sce) {
        return function (input, phrase) {
            if (phrase) {
                input = input.replace(new RegExp('(' + phrase + ')', 'gi'),
                    '<span class="highlighted">$1</span>');
            }
            return $sce.trustAsHtml(input);
        };
    }
]);
