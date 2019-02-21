/**
 * @description Servicio de normalizacion de objetos.
 * 
 * @type Service
 */
angular.module('adminPanel.crud').service('NormalizeService', [
    function () {
        function camelize(str) {
            return str.replace(/(\_\w)/g, function(m){
                return m[1].toUpperCase();
            });
        }
        
        /**
         * @description Copia el objeto y lo normaliza, es decir mira las propiedades del objeto, y si es otro objeto
         * y tiene un id, deja como valor de la propiedad el id del objeto.
         * 
         * @param {Object} obj Objeto a normalizar
         * @returns {Object} Copia del objeto normalizado
         */
        this.normalize = function (obj) {
            var object = angular.copy(obj);
            for(var key in object) {
                if(key.charAt(0) === '$') {
                    delete object[key];
                    continue;
                }

//                var name = camelize(key);
                var name = key;

                if('object' === typeof(object[key]) && object[key] !== null) {
                    if('undefined' !== typeof(object[key].id)) {
                        object[name] = object[key].id;
                    } else {
                        object[name] = this.normalize(object[key]);
                    }
                } else {
                    object[name] = object[key];
                }
                if(key != name) {
                    delete object[key];
                }
            }
            return object;
        };
    }
]);