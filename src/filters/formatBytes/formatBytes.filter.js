/**
 * @description Filtro que formatea un valor en bytes para usar las unidades B, KB, 
 *              MB, GB o TB.
 * 
 * @param input Valor que será formateado.
 * @returns {String} Ejemplo: 13,45KB
 */
angular.module('adminPanel.filters').filter('formatBytes', function () {
    return function (input) {
        if (!input || input < 0) {
            return '';
        }
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        var pow = Math.floor(Math.log(input) / Math.log(1024));
        pow = Math.min(pow, units.length - 1);
        input = input/(1 << (10 * pow));

        return Math.round(input * 10)/10 + ' ' + units[pow];
    };
});