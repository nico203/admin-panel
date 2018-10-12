/**
 * @description Provider que guarda las opciones de los selects con el fin de disminuir la cantidad de request realizadas
 * al servidor.
 *
 */
angular.module('adminPanel').factory('apSelectProvider', function() {
        var options = {};

        options.data = {};

        options.register = function(entity, field, request) {
            if (angular.isUndefined(options.data[entity])) {
                options.data[entity] = {};
            }
            options.data[entity][field] = request;
        };

        options.get = function(entity, field) {
            if (angular.isUndefined(options.data[entity])) {
                return null;
            }
            return options.data[entity][field];
        };
        
        options.remove = function(entity, field) {
            if (!angular.isUndefined(options.data[entity])) {
                options.data[entity][field] = null;
            }
        };

        return options;
    }
);