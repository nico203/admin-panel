/**
 * @description Filtro para mostrar 'Si' si el input es verdadero o 'No'
 *              si es falso.
 * 
 * @param input Valor que será evaluado.
 * @returns {String} 'Si' o 'No'
 */
angular.module('adminPanel.filters').filter('yesNo', function () {
    return function (input) {
        return input ? 'Si' : 'No';
    };
});