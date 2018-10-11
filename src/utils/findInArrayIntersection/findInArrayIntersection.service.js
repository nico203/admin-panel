/**
 * @description Función que busca un valor en la intersección de dos arreglos
 *
 * @param {Array} array1 Arreglo usado para calcular la intersección
 * @param {Array} array2 Arreglo usado para calcular la intersección
 * @param {String} value Valor que se busca en la intersección de array1 y array2
 * @returns {Boolean} Indica si value se encontró o no
 */
angular.module('adminPanel.utils').factory('findInArrayIntersection', [
    function() {
        var findInArrayIntersection = function (array1, array2, value) {
            var found = false;
            var i = 0;
            while (i < array2.length && !found) {
                var j = array2[i];
                if (angular.isArray(array1[j])) {
                    found = array1[j].indexOf(value) >= 0;
                }
                i++;
            }
            return found;
        };

        return findInArrayIntersection;
    }]
);