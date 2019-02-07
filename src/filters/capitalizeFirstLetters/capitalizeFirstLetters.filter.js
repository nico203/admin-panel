/**
 * @description Filtro que deja con mayúscula solo la primera letra de cada palabra.
 *              Se debe especificar qué caracter separa cada palabra, de lo contrario se usa el
 *              espacio en blanco.
 * 
 * @param {String} input Ejemplo: 'cada palabra quedará con mayúscula'.
 * @returns {String} Ejemplo: 'Cada Palabra Quedará Con Mayúscula'.
 */
angular.module('adminPanel.filters').filter('capitalizeFirstLetters', [
    'capitalizeFirstLetterFilter',
    function (capitalizeFirstLetterFilter) {
        return function (input, separatorCharacter) {
            separatorCharacter = separatorCharacter ? separatorCharacter : " ";

            var outputArray = input.split(separatorCharacter);
            var output = "";

            outputArray.forEach(function (element, key, array) {
                output += capitalizeFirstLetterFilter(element);
                if (key !== array.length - 1) {
                    output += separatorCharacter;
                }
            });

            return output;
        };
    }
]);