angular.module('adminPanel.crud').factory('CrudResource', [
    'CrudConfig', '$http', '$resource', 'NormalizeService', '$injector',
    function(CrudConfig, $http, $resource, NormalizeService, $injector) {
        /**
         * Parametros
         * -url sin la base
         * -nombre del recurso
         * -funcion del transform request  del recurso al guardarlo
         * -extend => servicio del cual extiende
         * -datos extras
         * @type {type}
        */
        function CrudResourceFactory(name, url, transform, parent, extras) {
            //name
            if(typeof(name) !== 'string') {
                console.error('CrudResourceFactory: el parametro name debe ser string');
                throw 'CrudResourceFactory: el parametro name debe ser string';
            }
            
            //url
            if(typeof(url) !== 'string') {
                console.error('CrudResourceFactory: el parametro url debe ser string');
                throw 'CrudResourceFactory: el parametro url debe ser string';
            }
            
            //Procesamos los transforms de los request y responses por defecto
            if(!angular.isUndefined(transform) && transform !== null && typeof(transform) !== 'object') {
                console.error('CrudResourceFactory: el parametro transform debe ser object');
                throw 'CrudResourceFactory: el parametro transform debe ser object';
            } 
            var transforms = {};
            transforms.query = (transform && transform.query) ? function(data) {
                return {
                    data: transform.query(data.data)
                };
            } : function(data) {
                return data;
            };
            transforms.request = (transform && transform.request) ? transform.request : function(data) {
                return data;
            };
            transforms.response = (transform && transform.response) ? function(data) {
                return {
                    data: transform.response(data.data)
                };
            } : function(data) {
                return data;
            };
            var paramDefaults = {};
            paramDefaults[name] = '@id';
            
            var options = {
                cancellable: true
            };
            
            var parentResource = null;
            if(parent) {
                parentResource = $injector.get(parent);
                
                //agregamos el parametro requerido para el objeto padre
                paramDefaults[parentResource.name] = '@' + parentResource.name;
            }
            //concatenamos las url del padre con la del recurso actual
            var resourceUrl = (parentResource) ? parentResource.url + url : url;
            
            //Procesamos las acciones del recurso
            var actions = {};
            for(var key in extras) {
                var extra = extras[key];
                //Le agregamos el basePath de la api a cada url del extra
                if(extra.url) {
                    extra.url = CrudConfig.basePath + extra.url;
                }
                //La establecemos que sea cancelable
                extra.cancellable = true;
                //Le ponemos como primer request el default de http
                if(extra.transformResponse) {
                    extra.transformResponse.unshift($http.defaults.transformResponse[0]);
                }
                
                actions[key] = extra;
            }
            
            actions.query = {
                method: 'GET',
                transformResponse: [
                    $http.defaults.transformResponse[0],
                    function(data) {
                        var ret = [];
                        for(var i = 0; i < data.length; i++) {
                            ret.push(transforms.response(data[i]));
                        }
                        return ret;
                    }
                ],
                isArray: false,
                cancellable: true
            };
            actions.get = {
                method: 'GET',
                transformResponse: [
                    $http.defaults.transformResponse[0],
                    transforms.response
                ],
                cancellable: true
            };
            actions.save = {
                method: 'POST',
                transformRequest: [
                    function(data) {
                        var ret = {};
                        ret.id = data.id;
                        
                        ret[name] = NormalizeService.normalize(transforms.request(data));
                        delete ret[name].id;
                        
                        return ret;
                    },
                    $http.defaults.transformRequest[0]
                ],
                cancellable: true
            };
            
            return {
                name: name,
                url: resourceUrl,
                parent: (parentResource) ? parentResource.name : null,
                $resource: $resource(CrudConfig.basePath + resourceUrl, paramDefaults, actions, options)
            };
        }
        
        return CrudResourceFactory;
    }
]);



