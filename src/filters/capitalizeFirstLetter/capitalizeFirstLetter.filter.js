/**
 * @description Filtro que deja con mayúscula solo la primera letra de una palabra
 *              o frase.
 * 
 * @param {String} input Ejemplo: 'la frase comenzará con mayúscula'.
 * @returns {String} Ejemplo: 'La frase comenzará con mayúscula'.
 */
angular.module('adminPanel.filters').filter('capitalizeFirstLetter', function () {
    return function (input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
});