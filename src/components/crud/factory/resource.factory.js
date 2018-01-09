angular.module('adminPanel.crud').factory('CrudResource', [
    'CrudConfig', '$http', '$resource', 'NormalizeService',
    function(CrudConfig, $http, $resource, NormalizeService) {
        
        /**
         * Parametros
         * -url sin la base
         * -nombre del recurso
         * -funcion del transform request  del recurso al guardarlo
         * -campo file
         * -datos extras
         * @type {type}
        */
        function CrudResourceFactory(name, url, transform, file, extras) {
            
            
            //name
            var nameDefault = null;
            var property = null;
            if(typeof(name) === 'string') {
                nameDefault = name;
            } else if(typeof(name) === 'object') {
                if(angular.isUndefined(name.name) || angular.isUndefined(name.property)) {
                    console.error('CrudResourceFactory: si el parametro name es un objeto, name y property deben establecerse como propiedades');
                    throw 'CrudResourceFactory: si el parametro name es un objeto, name y property deben establecerse como propiedades';
                }
                nameDefault = name.name;
                property = name.property;
            } else {
                console.error('CrudResourceFactory: el parametro name debe ser string o object');
                throw 'CrudResourceFactory: el parametro name debe ser string o object';
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
            paramDefaults[nameDefault] = '@id';
            
            var options = {
                cancellable: true
            };
            
            //Procesamos el campo file
            var fileObj = null;
            if(!angular.isUndefined(file) && file !== null && file !== false) {
                if(file === true) {
                    fileObj = {
                        url: '/files',
                        prop: 'file'
                    };
                } else if (typeof(file) === 'string') {
                    fileObj = {
                        url: '/' + file + 's',
                        prop: file
                    };
                } else if (typeof(file) === 'object') {
                    if(angular.isUndefined(file.url) || angular.isUndefined(file.prop)) {
                        console.error('CrudResourceFactory: si el parametro file es un objeto, url y prop deben establecerse como propiedades');
                        throw 'CrudResourceFactory: si el parametro file es un objeto, url y prop deben establecerse como propiedades';
                    }
                    fileObj = file;
                }
            }
            
            
            //Procesamos los extras
            var actions = {};
            var normalizeFn = function(data) {
                var ret = {};
                ret.id = data.id;
                if(property) {
                    ret[property] = NormalizeService.normalize(data[property]);
                    delete ret[property].id;
                } else {
                    ret[name] = NormalizeService.normalize(data);
                    delete ret[name].id;
                }
                return ret;
            };
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
                if(extra.transformRequest) {
                    extra.transformRequest.push($http.defaults.transformRequest[0]);
                }
                //para todos los request post se hace la normalizacion
                if(extra.method === 'POST') {
                    if(extra.transformRequest) {
                        extra.transformRequest.unshift(normalizeFn);
                    } else {
                        extra.transformRequest = [
                            normalizeFn,
                            $http.defaults.transformRequest[0]
                        ];
                    }
                }
                
                console.log(key, extra);
                
                actions[key] = extra;
            }
            if(fileObj !== null) {
                //Se recibe como objeto en el request todo el objeto y se envia solamente la propiedad que contiene
                //el archivo
                actions[fileObj.prop] = {
                    method: 'POST',
                    url: CrudConfig.basePath + url + fileObj.url,
                    transformRequest: [
                        function(data) {
                            var ret = {};
                            ret.id = data.id;
                            console.log('transformRequest, data',data);
                            ret[file.prop] = data[file.prop];
                            return ret;
                        },
                        $http.defaults.transformRequest[0]
                    ],
                    cancellable: true
                };
            }
            
            if(angular.isUndefined(actions.query)) {
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
            }
            
            if(angular.isUndefined(actions.get)) {
                actions.get = {
                    method: 'GET',
                    transformResponse: [
                        $http.defaults.transformResponse[0],
                        transforms.response
                    ],
                    cancellable: true
                };
            }
            
            
            /**
             * Accion por defecto que se utiliza para enviar datos al servidor, al persistir o modificar una entidad
             * Se envia el objeto de la forma
             * 
             * {
             *   id: id
             *   name: object
             * }
             * 
             * En donde el id es el identificador del objeto asociado y object es el objecto a persistir/modificar.
             * El valor de name depende de si la entidad esta asociada a otra, es decir, depende de esta. Si este
             * es el caso, entonces se envía al servidor el objeto encapsulado dentro de la cadena que se haya recibido
             * como parametro dentro del objeto 'name' en la definicion del objeto. Caso contrario, se envía el objeto 
             * encapsulado dentro del atributo con nombre igual a la entidad
             */
            if(angular.isUndefined(actions.save)) {
                actions.save = {
                    method: 'POST',
                    transformRequest: [
                        normalizeFn,
                        $http.defaults.transformRequest[0]
                    ],
                    cancellable: true
                };
            }
            
            console.log('actions',actions);
            
            return {
                name: nameDefault,
                property: property,
                file: fileObj,
                $resource: $resource(CrudConfig.basePath + url, paramDefaults, actions, options)
            };
        }
        
        return CrudResourceFactory;
    }
]);



