/**
 * @description Pregunta si una determinada propiedad de un objeto,
 *              de cualquiera de sus hijos, hijos de hijos, etc existe.
 * 
 * @param {Object} obj Cualquier objeto
 * @param key Propiedad por la que se pregunta. Ejemplo: 'loc.foo.bar'
 */
angular.module('adminPanel.utils').factory('hasProperty', [
    function () {
        var hasProperty = function (obj, key) {
            return key.split(".").every(function (x) {
                if (typeof obj != "object" || obj === null || !(x in obj)) {
                    return false;
                }
                obj = obj[x];
                return true;
            });
        };

        return hasProperty;
    }
]);