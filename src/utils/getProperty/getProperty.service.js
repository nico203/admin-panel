/**
 * @description Obtiene una propiedad de un objeto, de cualquiera de sus hijos,
 *              hijos de hijos, etc.
 * 
 * @param {Object} obj Cualquier objeto
 * @param key Propiedad que se quiere obtener del objeto. Ejemplo: 'loc.foo.bar'
 */
angular.module('adminPanel.utils').factory('getProperty', [
    function () {
        var getProperty = function (obj, key) {
            return key.split(".").reduce(function (o, x) {
                return (typeof o == "undefined" || o === null) ? o : o[x];
            }, obj);
        };

        return getProperty;
    }
]);