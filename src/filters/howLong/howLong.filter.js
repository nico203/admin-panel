/**
 * @description Filtro para motrar el tiempo transcurrido en días, meses o años.
 * 
 * @param input Cantidad de días, meses o años.
 * @param {String} timeUnit 'días', 'meses' o 'años'.
 * @param {String} initialWords Cualquier string que se quiera anteponer a la frase.
 * @returns {String} Ejemplos: 'Hace 3 años', 'Hace 2 días', '1 mes'.
 */
angular.module('adminPanel.filters').filter('howLong', function () {
    return function (input, timeUnit, initialWords) {

        if (angular.isUndefined(input) || input === null) {
            return '';
        }
        if (typeof timeUnit !== 'string' || timeUnit === null) {
            return '';
        }
        if (typeof initialWords !== 'string') {
            initialWords = '';
        } else {
            initialWords += ' ';
        }
        timeUnit = timeUnit.toLowerCase();
        if (input == '1') {
            switch (timeUnit) {
                case 'días':
                    timeUnit = 'día';
                    break;
                case 'meses':
                    timeUnit = 'mes';
                    break;
                case 'años':
                    timeUnit = 'año';
                    break;
            }
        }
        return initialWords + input + ' ' + timeUnit;
    };
});