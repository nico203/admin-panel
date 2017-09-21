angular.module('adminPanel.crud').factory('CrudResource', [
    'CrudConfig', '$http', '$resource', 'NormalizeService',
    function(CrudConfig, $http, $resource, NormalizeService) {
        /**
         * Parametros
         * -url sin la base
         * -nombre del recurso
         * -funcion del transform request  del recurso al guardarlo
         * -datos extras
         * @type {type}
        */
        function CrudResourceFactory(name, url, transform, extras) {
            var nameDefault = null;
            var property = null;
            if(typeof(name) === 'string') {
                nameDefault = name;
            } else {
                nameDefault = name.name;
                property = name.property;
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
            paramDefaults[nameDefault] = '@id';
            
            var options = {
                cancellable: true
            };
            
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
                        if(property) {
                            ret[property] = NormalizeService.normalize(transforms.request(data[property]));
                            delete ret[property].id;
                        } else {
                            ret[nameDefault] = NormalizeService.normalize(transforms.request(data));
                            delete ret[nameDefault].id;
                        }
                        return ret;
                    },
                    $http.defaults.transformRequest[0]
                ],
                cancellable: true
            };

            return {
                name: nameDefault,
                property: property,
                $resource: $resource(CrudConfig.basePath + url, paramDefaults, actions, options)
            };
        }
        
        return CrudResourceFactory;
    }
]);



