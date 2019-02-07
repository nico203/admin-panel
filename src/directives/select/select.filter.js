/**
 * @description Filtro aplicado a las opciones del select
 */
angular.module('adminPanel').filter('selectOption', function() {
    return function(input) {
        var output = input;
        if (input === '') {
            output = ' - Sin selección -';
        }
        return output;
    };
});