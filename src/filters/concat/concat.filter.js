/**
 * @description Filtro que concatena un array de valores.
 * 
 * @param {Array} input ['item1', 'item2', 'item3'].
 * @param {String} delimiter Caracter que une los elementos del input.
 * @returns {String} Ejemplo: 'intem1, item2, intem3'
 */
angular.module('adminPanel.filters').filter('concat', function () {
    return function (input, delimiter) {
        if (angular.isUndefined(input) || input === null) {
            return '';
        } else if (!Array.isArray(input)) {
            return input;
        } else {
            var newInputData = [];
            input.forEach(function (element) {
                if (angular.isDefined(element) && element !== null) {
                    newInputData.push(element);
                }
            });
            if (delimiter) {
                return newInputData.join(delimiter);
            } else {
                return newInputData.join();
            }
        }
    };
});