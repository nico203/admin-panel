angular.module('adminPanel', [
    'ngAnimate',
    'adminPanel.authentication',
    'adminPanel.crud'
]).directive('adminPanel', [
    function() {
        return {
            restrict: 'E',
            templateUrl: 'components/admin-panel/admin-panel.template.html'
        };
    }
]);;angular.module('adminPanel.crud', [
    'adminPanel',
    'ngResource'
]);;angular.module('adminPanel.crud').factory('CrudResource', [
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
            transforms.query = (transform && transform.query) ? transform.query : function(data) {
                return data;
            };
            transforms.request = (transform && transform.request) ? transform.request : function(data) {
                return data;
            };
            transforms.response = (transform && transform.response) ? transform.response : function(data) {
                return data;
            };
            var paramDefaults = {};
            paramDefaults[nameDefault] = '@id';
            if(extras) {
                for(var key in extras) {
                    extras[key].url = CrudConfig.basePath + extras[key].url;
                }
            }
            
            var options = {
                cancellable: true
            };
            
            var actions = (extras) ? extras : {};
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



;angular.module('adminPanel.crud').provider('CrudConfig', function() {
    var basePath = '';
    var messages = {
        saveError: 'Hubo un error al guardar los datos en el servidor. Recarga la página e inténtalo de nuevo',
        saveSusccess: 'Datos guardados exitosamente',
        loadError: 'Hubo un error al obtener los datos del servidor. Pruebe con recargar la página'
    };
    
    this.setBasePath = function(path) {
        basePath = path;
        return this;
    };
    
    this.setMessages = function(msg) {
        messages.saveError = (msg.saveError) ? msg.saveError : messages.saveError;
        messages.saveSusccess = (msg.saveSusccess) ? msg.saveSusccess : messages.saveSusccess;
        messages.loadError = (msg.loadError) ? msg.loadError : messages.loadError;
        
        return this;
    };
    
    this.$get = function() {
        return {
            basePath: basePath,
            messages: messages
        };
    };
});;angular.module('adminPanel.crud').service('CrudService', [
    '$timeout','CrudConfig',
    function($timeout, CrudConfig) {
        /**
         * @description Objeto que tiene dos funciones, submit e init. Realiza las funciones de consulta y actualizacion
         * de formulario. Debe haber un solo de estos elementos por formulario.
         * 
         * @param {Scope} scope Scope al cual apunta los eventos
         * @param {CrudResource} Resource | Resource que se utiliza para hacer las peticiones al servidor
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {CrudService.serviceL#3.Form}
         */
        var Form = function(scope, Resource, apLoadName) {
            /**
             * @description metodo que inicializa el formulario con datos del servicor.
             * 
             * @param {Object} object Objeto a enviar al servidor para hacer la consulta 
             * @param {type} callbackSuccess Funcion que se llama si la peticion es exitosa
             * @param {type} callbackError Funcion que se llama si hubo un error en la peticion.
             * @returns {undefined}
             */
            this.init = function(object, callbackSuccess, callbackError) {
                scope.$emit('apLoad:start',apLoadName);
                var request = Resource.get(object);
                request.$promise.then(function(responseSuccess) {
                    scope.$emit('apLoad:finish', apLoadName);
                    if(callbackSuccess) {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.loadError,
                        type: 'error'
                    });
                    if(callbackError) {
                        callbackError(responseError);
                    }
                });
            };

            /**
             * @description Metodo que envia los datos del formulario al servidor para hacer la actualizacion
             * 
             * @param {Object} object Objeto a enviar al servidor para persistir los datos. 
             * @param {type} callbackSuccess Funcion que se llama si la peticion es exitosa
             * @param {type} callbackError Funcion que se llama si hubo un error en la peticion.
             * @returns {undefined}
             */
            this.submit = function(object, callbackSuccess, callbackError) {
                scope.$emit('apLoad:start',apLoadName);
                var request = Resource.save(object);
                request.$promise.then(function(responseSuccess) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.saveSusccess,
                        type: 'success'
                    });
                    if(callbackSuccess) {
                        callbackSuccess(responseSuccess);
                    }
                }, function(responseError) {
                    scope.$emit('apLoad:finish', apLoadName, {
                        message: CrudConfig.messages.saveError,
                        type: 'error'
                    });
                    if(callbackError) {
                        callbackError(responseError);
                    }
                });
            };
        };
        
        /**
         * @description Lista los objetos en la vista que son obtenidos del servidor
         * 
         * @param {Scope} scope Scope al cual apunta los eventos
         * @param {CrudResource} Resource | Resource que se utiliza para hacer las peticiones al servidor
         * @param {String} apLoadName Nombre de la directiva load a usar. Si no se especifica, se usa la directiva por default.
         * @returns {CrudService.serviceL#3.ListFn}
         */
        var ListFn = function(scope, Resource,apLoadName) {
            var request = null;
            /**
             * @description Realiza el pedido de objetos al servidor para listar
             * 
             * @param {Object} object Objeto a buscar en el servidor
             * 
             * @param {function} callbackSuccess Funcion que se llama si la peticion es exitosa
             * 
             * @param {function} callbackError Funcion que se llama si hubo un error en la peticion.
             * 
             * @param {String} actionDefault Metodo a ejecutar del CrudResource
             * @default 'get'
             * 
             * @returns {undefined}
             */
            this.get = function (object, callbackSuccess, callbackError, actionDefault) {
                //timeout requerido para terminar el binding de los componentes de la aplicacion
                $timeout(function () {
                    scope.$broadcast('apLoad:start',apLoadName);
                    var action = (actionDefault) ? actionDefault : 'get';

                    if(request && !request.$promise.$resolved) {
                        request.$cancelRequest();
                    }
                    request = Resource[action](object);
                    request.$promise.then(function(responseSuccess) {
                        scope.$broadcast('apLoad:finish',apLoadName);
                        if(callbackSuccess) {
                            callbackSuccess(responseSuccess);
                        }
                    }, function(responseError) {
                        if(responseError.status === -1) return;
                        scope.$broadcast('apLoad:finish',apLoadName, {
                            message: CrudConfig.messages.loadError,
                            type: 'error'
                        });
                        if(callbackError) {
                            callbackError(responseError);
                        }
                    });
                }, 100);
            };
        };
        
        /**
         * @description Inicializa el controlador del componente para tener el formulario del servidor
         * 
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {undefined}
         */
        function BasicFormController(controller, resource, scope, apLoadName) {
            var name = resource.name;
            var form = new Form(scope, resource.$resource, apLoadName);
            scope[name] = {};
            
            scope.submit = function() {
                if(!scope.form) {
                    form.submit(scope[name], function(r) {
                        if(r.data) {
                            scope[name] = r.data;
                        }
                    });
                }
                else if(scope.form.$valid) {
                    form.submit(scope[name], function(r) {
                        if(r.data) {
                            scope[name] = r.data;
                        }
                    });
                }
            };

            controller.$onInit = function() {
                var property = resource.property;
                if(property) {
                    scope[name] = this[name];
                    if(scope[name][property]) {
                        scope[property] = scope[name][property];
                    } else {
                        scope[name][property] = scope[property];
                    }
                    return;
                }
                if(this[name] && this[name] !== 'nuevo') {
                    var obj = {};
                    obj[name] = this[name];
                    form.init(obj, function(r) {
                        scope[name] = r.data;
                    });
                }
            };
        }
        
        /**
         * @description Inicializa el controlador del componente para listar entidades del servidor
         * 
         * @param {Controller} controller Controller del componente
         * @param {CrudResource} resource Recurso del servidor a usar para obtener los datos
         * @param {Scope} scope Scope del componente
         * @param {String} apLoadName | Nombre de la directiva load al que apuntar para ocultar la vista en los intercambios con el servidor
         * @returns {undefined}
         */
        function BasicListController(controller, resource, scope, apLoadName) {
            scope.list = [];
            var List = new ListFn(scope, resource.$resource, apLoadName);
            
            controller.$onInit = function () {
                controller.list();
            };
            
            controller.list = function(params, actions, callback) {
                var listParams = (params) ? params : {};
                List.get(listParams, function(r) {
                    scope.list = r.data;
                    scope.$broadcast('pagination:paginate', {
                        totalPageCount: r.totalPageCount,
                        currentPageNumber: r.currentPageNumber
                    });
                    if(callback) callback();
                }, function(){}, actions);
            };
            
            scope.$on('pagination:changepage', function(e, page) {
                e.stopPropagation();
                controller.list({
                    page: page
                });
            });
        }
        
        
        return {
            form: Form,
            list: ListFn,
            basicFormController: BasicFormController,
            basicListController: BasicListController
        };
    }
]);
;/**
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
]);;function navigationController($scope, $timeout, AdminPanelConfig) {
    $scope.items = AdminPanelConfig.navigationItems;
    $scope.elem = $('navigation');
    
    this.$onInit = function() {
        //En este caso $timeout es usado para ejecutar una funcion despues de que termine el ciclo $digest actual
        //cuando se termino de linkear todos los elementos de ngRepeat
        //https://stackoverflow.com/questions/15207788/calling-a-function-when-ng-repeat-has-finished
        $timeout(function() {
            $scope.elem = $('navigation');
            $scope.accordion = new Foundation.AccordionMenu($scope.elem);
            $scope.elem.find('> .menu').addClass('visible');
        });
    };

    this.$onDestroy = function() {
        if($scope.accordion) {
            $scope.accordion.$element.foundation('_destroy');
        }
    };
}

angular.module('navigation', [
    'adminPanel'
]).component('navigation', {
    templateUrl: 'components/navigation/navigation.template.html',
    controller: ['$scope', '$timeout', 'AdminPanelConfig', navigationController]
});;function topBarController($scope, AuthenticationService, $location) {
    $scope.clickBtn = function() {
        AuthenticationService.logout();
        $location.path('/login');
    };
    
    this.$postLink = function() {
        $('top-bar').foundation();
    };
}

angular.module('topBar', [
    'adminPanel.authentication'
]).component('topBar', {
    templateUrl: 'components/top-bar/top-bar.template.html',
    controller: ['$scope', 'AuthenticationService', '$location', topBarController]
});;angular.module('adminPanel').directive('apAccordion',function(){
    return {
        require: 'ngModel',
        restrict: 'AE',
        transclude: true,
        scope: {
            allowAllClosed: '=',
            multiExpand: '=',
            addButtonText: '@?',
            name: '@?'
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('ap-accordion');
            
            scope.accordion = new Foundation.Accordion(elem.find('.accordion'), {
                'data-multi-expand':scope.multiExpand,
                'data-allow-all-closed':scope.allowAllClosed
            });
            
            scope.addElement = function() {
                var obj = {};
                var name = (scope.name) ? scope.name : 'default';
                scope.$emit('ap.accordion.add', obj, name);
                ngModel.$modelValue.push(obj);
            };
            
            scope.removeElement = function(object) {
                scope.$emit('ap.accordion.remove', object);
                var array = ngModel.$modelValue;
                var index = array.indexOf(object);
                if (index > -1) {
                    array.splice(index, 1);
                }
            };
        },
        controller: ['$scope', function($scope) {
            this.toggleTab = function(tab) {
                $scope.accordion.$element.foundation('toggle', tab);
            };
                
            this.removeElement = function(object) {
                $scope.removeElement(object);
            };
            
            this.reInitComponent = function() {
                $scope.accordion.$element.foundation('up', $scope.accordion.$tabs.find('.accordion-content'));
                Foundation.reInit($scope.accordion.$element);
            };
        }],
        templateUrl: 'directives/accordion/accordion.template.html'
    };
});
;angular.module('adminPanel').directive('apAccordionItem', function(){
    return {
        require: ['^^apAccordion', 'ngModel'],
        restrict: 'AE',
        transclude: true,
        scope: {
            itemDefaultTitle: '@?',
            deleteButton: '=?'
        },
        link: function(scope, elem, attr, controller) {
            scope.title = '';
            attr.$set('dataAccordionItem', '');
            elem.addClass('accordion-item is-active');
            controller[0].reInitComponent(); /* Parent controller */
            
            scope.deleteElement = function() {
                controller[0].removeElement(controller[1].$modelValue);
            };
            
            scope.toggleTab = function() {
                controller[0].toggleTab(elem.find('.accordion-content'));
            };
            
            if(scope.itemDefaultTitle !== undefined) {
                scope.title = scope.itemDefaultTitle;
            }
            
        },
        controller: ['$scope', function ($scope) {
                this.changeTitleName = function(val) {
                    $scope.title = val;
                };
        }],
        templateUrl: 'directives/accordion/accordionItem.template.html'
    };
});
;angular.module('adminPanel').directive('apAccordionItemTitle', ['$parse',function($parse){
    return {
        require: ['^^apAccordionItem', 'ngModel'],
        restrict: 'A',
        link: function(scope, elem, attr, controller) {
            scope.objectValues = $parse(attr.apAccordionItemTitle)(scope);

            scope.$watch(function() {
                return controller[1].$modelValue;
            }, function (val) {
                if(!val) return;
                var title = '';
                if(val instanceof Date) { 
                    title = val.toLocaleString();
                } else {
                    if(scope.objectValues instanceof Array) {
                        title = '';
                        for(var i = 0; i < scope.objectValues.length; i++) {
                            title += val[scope.objectValues[i]] + ', ';
                        }
                        title = title.replace(/,\s*$/, "");
                    } else {
                        title = val;
                    }
                }
                controller[0].changeTitleName(title);
            });
        }
    };
}]);;//Mirar el componente cars de foundation

//Ver de sacar el isolated scope asi se puede usar scope broadcast en este elemento

angular.module('adminPanel').directive('apBox', [
    '$rootScope',
    function ($rootScope) {
        return {
            restrict: 'AE',
            priority: 100,
//        terminal: true,
            transclude: true,
            scope: {
                title: '@',
                init: '&?'
            },
            compile: function (elem, attr) {
                elem.addClass('ap-box');
                var pagination = (typeof (attr.paginate) !== 'undefined');

                if (pagination) {
                    var paginationDirective = angular.element('<ap-pagination>');
                    elem.find('.pager').append(paginationDirective);
                }

                //Link function
                return function (scope, elem, attr) {
                    //El boton de cierre del box se muestra solamente si tiene seteado 
                    //el atributo name, el cual debe ser el nombre del evento que lo muestra.
                    scope.closeButton = (typeof (attr.name) !== 'undefined');
                    scope.message = null;
                    scope.loads = {};
                    scope.elem = elem;
//                    scope.isHide = false;
                    scope.isHide = scope.closeButton;
                    //buscamos todas las directivas ap-load en los elementos hijos
                    var loadDirectives = elem.find("[ap-load]");
                    for (var i = 0; i < loadDirectives.length; i++) {
                        var ctrl = angular.element(loadDirectives[i]).controller('apLoad');
                        var name = ctrl.getName();
                        if (name) {
                            scope.loads[name] = ctrl;
                        }
                    }

                    //Ejecutada al comenzar la peticion al servidor
                    function startLoad(e, name) {
                        console.log($.extend({}, e));
                        scope.message = null;
                        var loadDirectiveName = (name) ? name : 'default';
                        if (!scope.loads[loadDirectiveName]) {
                            throw 'apLoad: ' + loadDirectiveName + ' not found';
                        }
                        scope.loads[loadDirectiveName].hide();
                    }
                    //Ejecutada al terminar la peticion al servidor
                    function finishLoad(e, name, message) {
                        scope.message = message;
                        var loadDirectiveName = (name) ? name : 'default';
                        if (!scope.loads[loadDirectiveName]) {
                            throw 'apLoad: ' + loadDirectiveName + ' not found';
                        }
                        scope.loads[loadDirectiveName].show();
                    }

                    //Ejecutada al ingresar el mouse al elemento. Aplica la clase para iluminar el box
                    function onMouseEnter() {
                        scope.elem.removeClass('no-visible');
                        $rootScope.$broadcast('box.directive.mouseenter', scope.elem);
                    }

                    //Funcion ejecutada al ingresar el mouse a otro box en la pantalla
                    function onMouseEnterInOtherBox(e, elem) {
                        if (scope.elem === elem) {
                            return;
                        }
                        scope.elem.addClass('no-visible');
                    }

                    //Funcion que se usa para mostrar el box al lanzar determinado 
                    //evento con el nombre determinado para el box
                    function showOnEvent(e, name) {
                        if (attr.name === name) {
                            scope.isHide = false;
                        }
                    }

                    //Funcion ejecutada para cerrar el box
                    scope.close = function () {
                        scope.isHide = true;
                    };

                    scope.$watch('isHide', function boxIsHideWatchAction(val) {
                        if(val) {
                            elem.hide();
                        } else {
                            elem.show();
                        }
                    });
                    elem.on('mouseenter', onMouseEnter);
                    var onMouseEnterInOtherBoxDestructor = scope.$on('box.directive.mouseenter', onMouseEnterInOtherBox);
                    var showOnEventDestructor = scope.$on('apBox:show', showOnEvent);
                    var startEventDestructor = scope.$on('apLoad:start', startLoad);
                    var finishEventDestructor = scope.$on('apLoad:finish', finishLoad);
                    var destroyEventDestructor = scope.$on('$destroy', function () {
                        //Unbind events
                        elem.off('mouseenter', onMouseEnter);
                        onMouseEnterInOtherBoxDestructor();
                        showOnEventDestructor();
                        startEventDestructor();
                        finishEventDestructor();
                        destroyEventDestructor();
                    });

                    if (scope.init) {
                        scope.init();
                    }
                };
            },
            templateUrl: 'directives/box/box.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('apDateTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datetimepicker');
            scope.hours = null;
            scope.minutes = null;
            scope.date = null;
            var options = {
                format: 'dd/mm/yyyy'
//                pickTime: true,
//                initialDate: scope.date
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                if(val) {
                    var date = new Date(val);
                    scope.date = date;
                    $(elem.find('.ap-date')).fdatepicker('update', date);
                    scope.hours = date.getHours();
                    scope.minutes = date.getMinutes();
                }
            });
            
            function changeDateTime(date, hours, minutes) {
                var h = (hours !== null) ? hours : scope.hours;
                var m = (minutes !== null) ? minutes : scope.minutes;
                date.setSeconds(0);
                
                date.setHours(h);
                date.setMinutes(m);
                $timeout(function() {
                    scope.$apply(function(){
                        
                        ngModel.$setViewValue(date);
                    });
                }, 100);
            }
            
            $(elem.find('.ap-date')).fdatepicker(options)
                    .on('changeDate', function(ev){
                scope.date = ev.date;
                scope.date.setHours(scope.date.getHours() + (scope.date.getTimezoneOffset() / 60));
                changeDateTime(scope.date);
            });
            
            scope.changeHour = function() {
                if(scope.hours < 0) {
                    scope.hours = 0;
                }
                if(scope.hours > 23) {
                    scope.hours = 23;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
            
            scope.changeMinute = function() {
                if(scope.minutes < 0) {
                    scope.minutes = 0;
                }
                if(scope.minutes > 59) {
                    scope.minutes = 59;
                }
                changeDateTime(scope.date, scope.hours, scope.minutes);
            };
        },
        templateUrl: 'directives/dateTimePicker/dateTimePicker.template.html'
    };
}]);
;angular.module('adminPanel').directive('fieldErrorMessages', [
    function() {
        return {
            restrict: 'E',
            scope: {
                errors: '='
            },
            link: function(scope, elem) {
                elem.addClass('form-error');
                console.log('fieldErrorMessages',scope);
            },
            templateUrl: 'directives/form/fieldErrorMessages.template.html'
        };
    }
]);

;angular.module('adminPanel').directive('formValidation', [
    '$parse','$compile',
    function($parse,$compile) {
        return {
            require: 'form',
            restrict: 'A',
            scope: true,
            link: function(scope, elem, attr, formCtrl) {
                console.log('formCtrl',formCtrl);
                //Definimos las validaciones
                var required = function(fieldCtrl, expression) {
                    if(angular.isUndefined(expression)) {
                        expression = true;
                    }
                    return function(modelValue, viewValue) {
                        return !expression || !fieldCtrl.$isEmpty(viewValue);
                    };
                };
                var number = function(ctrl) {
                    
                };
                
                var validators = {
                    required: required
                };
                
                
                //Seteamos las validaciones
                var validations = $parse(attr.formValidation)(scope);
                scope.validations = {};
                for(var field in validations) {
                    var fieldCtrl = formCtrl[field];
                    var fieldDOMElem = fieldCtrl.$$element;
                    console.log(fieldCtrl);
                    var messages = {};
                    for(var validation in validations[field]) {
                        var validator = validations[field][validation];
                        fieldCtrl.$validators[validation] = validators[validation](fieldCtrl, validator.expression);
                        messages[validation] = validator.message;
                    }
                    scope.validations[field] = {
                        errors: fieldCtrl.$error,
                        messages: messages
                    };
                    var fieldErrorMessagesDirective = angular.element('<field-error-messages errors="validations.'+field+'.errors" messages="validations.'+field+'.messages">');
                    $compile(fieldErrorMessagesDirective)(scope);
                    fieldDOMElem.after(fieldErrorMessagesDirective);
                }
                console.log(scope.validations);
            }
        };
    }
]);;/**
 * Directiva que maneja el control de las clases de error en un campo de un formulario. 
 * Usa las clases de foundation para el estado de error de un campo.
 * http://foundation.zurb.com/sites/docs/abide.html
 * 
 * Tambien setea los mensajes a mostrar en la aplicacion. Si no se setea ninguno se toman los mensajes por defecto.
 * Toma los errores del input que tiene definido como elemento hijo.
 * Los mensajes deben ser definidos como un objeto en donde la clave es el nombre del error y el valor es el mensaje
 * var obj = {
 *   error: 'msg'
 * }
 */
angular.module('adminPanel').directive('formFieldError', [
    '$animate','$compile','AdminPanelConfig',
    function($animate,$compile,AdminPanelConfig) {
        return {
            require: '^form',
            restrict: 'A',
            scope: {
                messages: '=?',
                expr: '='
            },
            link: function(scope, elem, attr, ctrl) {
                scope.inputElem = elem.find('input');
                scope.inputErrors = ctrl[scope.inputElem.attr('name')].$error;
                scope.errors = {};
                for(var key in scope.messages) {
                    scope.errors[key] = {
                        expresion: false,
                        message: scope.messages[key]
                    };
                }
                scope.fieldErrorMsgDirective = angular.element('<field-error-messages>');
                scope.fieldErrorMsgDirective.attr('errors', 'errors');
                elem.append(scope.fieldErrorMsgDirective);
                $compile(scope.fieldErrorMsgDirective)(scope);
                
                //Evaluamos los errores del campo hijo segun su nombre
                //Ver propiedad $error en https://docs.angularjs.org/api/ng/type/form.FormController
                scope.$watch('inputErrors', function(val) {
                    console.log('inputErrors', val);
                    for(var key in val) {
                        if(!scope.errors[key]) {
                            scope.errors[key] = {
                                expresion: false,
                                message: (scope.messages) ? scope.messages[key] : AdminPanelConfig.defaultFormMessages[key]
                            };
                        }
                        scope.errors[key].expresion = val[key];
                    }
                });
                
                //Evaluamos la expresion pasada al atributo de la directiva, si es verdadero 
                //seteamos las clases de error al formulario
                scope.$watch('expr', function(val) {
                    console.log('val', val);
                    $animate[val ? 'addClass' : 'removeClass'](elem, 'is-invalid-label');
                    $animate[val ? 'addClass' : 'removeClass'](scope.inputElem, 'is-invalid-input');
                    $animate[val ? 'addClass' : 'removeClass'](scope.fieldErrorMsgDirective, 'is-visible');
                });
            }
        };
    }
]);
;angular.module('adminPanel').directive('apLoad', [
    '$animate', '$compile', 
    function($animate, $compile){
    return {
        restrict: 'A',
        priority: 50,
        link: function(scope, elem, attr) {
            function init() {
                //controla que no haya una directiva ap-load en sus elementos hijos
                var name = attr.apLoad;
                if(elem.find("[ap-load='"+name+"']").length !== 0) {return;}
                
                scope.name = (name) ? name : 'default';
                elem.addClass('ap-load');
                var img = angular.element('<ap-loading-img>');
                elem.append(img);
                $compile(img)(scope);
                
                scope.show = function() {
                    $animate.removeClass(elem, 'loading');
                };

                scope.hide = function() {
                    $animate.addClass(elem, 'loading');
                };
            }
            init();
        },
        controller: ['$scope',function($scope) {
            
            this.getName = function() {
                return $scope.name;
            };
            
            this.show = function() {
                $scope.show();
            };
            
            this.hide = function() {
                $scope.hide();
            };
            
        }]
    };
}
]);
;angular.module('adminPanel').directive('apLoadingImg', ['AdminPanelConfig', 
    function(AdminPanelConfig){
        return {
            restrict: 'AE',
            priority: 60,
            link: function(scope, elem) {
                elem.addClass('ap-load-image');
                scope.path = AdminPanelConfig.imgLoadingRsc;
            },
            templateUrl: 'directives/load/loadingImg.template.html'
        };
    }
]);
;angular.module('adminPanel').directive('msfCoordenadas', [
    function() {
    return {
        require: 'ngModel',
        restrict: 'E',
        link: function(scope, elem, attr, ngModel) {
            scope.coordenadas = '';
            scope.error = false;
            scope.model = {
                latitud: angular.copy(ngModel.$modelValue.latitud),
                longitud: angular.copy(ngModel.$modelValue.longitud)
            };
            
            scope.$watch(function() {
                return ngModel.$modelValue;
            }, function(val) {
                console.log(val);
                if(val) {
                    scope.model = {
                        latitud: angular.copy(ngModel.$modelValue.latitud),
                        longitud: angular.copy(ngModel.$modelValue.longitud)
                    };
                }
            });
            
            scope.cambioCoordeandas = function() {
                var latitud = false, longitud = false;
                scope.error = false;
                
                //validacion
                var latRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var lngRegex =/^(([-])(\d)+((\.)(\d{2})(\d+)))$/;
                var splits = [',', ':', ' ', '.'];
                
                for(var i = 0; i < splits.length; i++) {
                    var arr = scope.coordenadas.replace(/\s+/g, '').split(splits[i]);
                    if (arr.length === 2) {
                        latitud = parseFloat( arr[0].replace(',', '.').match(latRegex) );
                        longitud = parseFloat( arr[1].replace(',', '.').match(lngRegex) );
                    } else if (arr.length === 4) {
                        latitud = parseFloat( (arr[0] + '.' + arr[1]).match(latRegex) );
                        longitud = parseFloat( (arr[2] + '.' + arr[3]).match(lngRegex) );
                    }
                }
                if(!latitud || !longitud //||
//                        latitud < -31.99 || latitud > -31 ||
//                        longitud < -61.99 || longitud > -60.3
                    ){
                    scope.model.latitud = '';
                    scope.model.longitud = '';
                    scope.error = true;
                    return;
                }
                scope.model.latitud = latitud;
                scope.model.longitud = longitud;
                ngModel.$modelValue.latitud = latitud;
                ngModel.$modelValue.longitud = longitud;
                console.log(scope.model);
                
                scope.$emit('msfCoordenadas:change', this);
            };
        },
        templateUrl: 'directives/msfCoordenadas/msfCoordenadas.template.html'
    };
}]);
;angular.module('adminPanel').directive('apPagination', [
    'AdminPanelConfig',
    function(AdminPanelConfig){
        return {
            restrict: 'AE',
            priority: 50,
            link: function(scope, elem, attr) {
                var Pagination = function(showPagesCount) {
                    this.currentPage = 1;
                    this.pageCount = 10;
                    this.pages = [];
                    this.activeLastFirst = false;
                    this.enableNextPage = false;
                    this.enablePreviousPage = false;
                    this.enableFirstPage = false;
                    this.enableLastPage = false;
                    this.bottomPage = 1;
                    this.topPage = showPagesCount;

                    var generatePages = function(first, last) {
                        var ret = [];
                        for(var i = first; i <= last; i++) {
                            ret.push(i);
                        }
                        return ret;
                    };
                    
                    this.rePaginate = function() {
                        var margin = Math.floor(showPagesCount / 2);
                        var generate = !((this.bottomPage === 1 && this.currentPage <= margin) ||
                                (this.topPage === this.pageCount && this.currentPage >= this.pageCount - margin));
                        if(generate) {
                            if(this.currentPage - margin < 1) {
                                this.bottomPage = 1;
                                this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                            } else if(this.currentPage + margin > this.pageCount) {
                                this.topPage = this.pageCount;
                                this.bottomPage = this.activeLastFirst ? this.pageCount - showPagesCount + 1 : 1;
                            } else {
                                this.topPage = this.currentPage + margin;
                                this.bottomPage = this.currentPage - margin;
                            }
                            this.pages = generatePages(this.bottomPage, this.topPage);
                        }
                    };

                    this.changePage = function(page) {
                        if(this.currentPage === page) return;
                        scope.$emit('pagination:changepage', page);
                        this.currentPage = page;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enablePreviousPage = (this.currentPage > 1);
                        if(this.activeLastFirst) {
                            this.enableFirstPage = (this.currentPage > 1);
                            this.enableLastPage = (this.currentPage < this.pageCount);
                        }

                        this.rePaginate();
                    };

                    this.nextPage = function() {
                        if(page === this.pageCount) return;
                        var page = this.currentPage + 1;
                        this.changePage(page);
                    };

                    this.previousPage = function() {
                        if(page === 1) return;
                        var page = this.currentPage - 1;
                        this.changePage(page);
                    };

                    this.init = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.activeLastFirst = (this.pageCount > showPagesCount);
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.bottomPage = 1;
                        this.topPage = this.activeLastFirst ? showPagesCount : this.pageCount;
                        this.pages = generatePages(this.bottomPage, this.topPage);
                    };
                    
                    this.reInit = function(data) {
                        this.pageCount = data.totalPageCount;
                        this.currentPage = data.currentPageNumber;
                        this.enableNextPage = (this.currentPage < this.pageCount);
                        this.enableLastPage = (this.activeLastFirst && this.currentPage < this.pageCount);
                        this.rePaginate();
                    };
                };
                scope.paginationInit = false;
                scope.pagination = new Pagination(AdminPanelConfig.pagination);
                
                scope.$on('pagination:paginate', function(e, data) {
                    if(scope.paginationInit) {
                        scope.pagination.reInit(data);
                    } else {
                        scope.paginationInit = true;
                        scope.pagination.init(data);
                    }
                });
            },
            templateUrl: 'directives/pagination/pagination.template.html'
        };
    }
]);

;angular.module('adminPanel').directive('apSelect', [
    '$timeout', '$rootScope',
    function ($timeout, $rootScope) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                reosource: '=',
                search: '=?',
                names: '=',
                onChange: '&?'
            },
            link: function (scope, elem, attr, ngModel) {
                //habilitamos el boton para agregar entidades
                scope.enableNewButton = !(angular.isUndefined(attr.new) || attr.new === null);
                scope.menuOpen = false;
                scope.loading = true;
                scope.dropdownContainer = elem.find('.dropdown-ap');
                scope.inputElem = elem.find('input');
                elem.addClass('select-ap');

                //Se ejecuta cuando el usuario da click al boton nuevo.
                //Lanza el evento para mostrar el box correspondiente
                scope.newObject = function () {
                    $rootScope.$broadcast('apBox:show', attr.new);
                };

                scope.request = null;
                scope.input = '';

                scope.onInputChange = function (all) {
                    var search = scope.search || {};
                    if (!all) {
                        for (var j = 0; j < scope.names.length; j++) {
                            search[scope.names[j]] = scope.input;
                        }
                    }
                    scope.loading = true;

                    if (scope.request) {
                        scope.request.$cancelRequest();
                    }

                    scope.request = scope.reosource.get(search, function (r) {
                        scope.loading = false;
                        var options = r.data;
                        scope.options = [];
                        for (var i = 0; i < options.length; i++) {
                            var name = '';
                            for (var j = 0; j < scope.names.length; j++) {
                                name += options[i][scope.names[j]] + ', ';
                            }
                            name = name.replace(/,\s*$/, "");

                            var obj = options[i];
                            obj.name = name;
                            scope.options.push(obj);
                        }
                    });
                };

                scope.optionSelected = function (option) {
                    var obj = angular.copy(option);
                    delete obj.name;
                    ngModel.$setViewValue(obj);
                    $timeout(function () {
                        scope.input = option.name;
                    }, 50);
                };

                scope.buttonClick = function () {
                    scope.menuOpen = !scope.menuOpen;
                    if (scope.menuOpen) {
                        scope.onInputChange(true);
                    }
                };
                scope.onFocus = function () {
                    scope.menuOpen = true;
                };
                scope.onBlur = function () {
                    $timeout(function () {
                        scope.menuOpen = false;
                    }, 100);
                };

                scope.$watch(function () {
                    return scope.menuOpen;
                }, function (val) {
                    if (val) {
                        scope.inputElem.focus();
                        scope.dropdownContainer.addClass('is-open');
                    } else {
                        scope.dropdownContainer.removeClass('is-open');
                    }
                });
                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (val) {
                    if (typeof (scope.onChange) !== 'undefined') {
                        scope.onChange({
                            option: val
                        });
                    }
                    var input = '';
                    if (val) {
                        for (var j = 0; j < scope.names.length; j++) {
                            input += val[scope.names[j]] + ', ';
                        }
                        input = input.replace(/,\s*$/, "");
                    }
                    scope.input = input;
                });
            },
            templateUrl: 'directives/select/select.template.html'
        };
    }
]);
;angular.module('adminPanel').filter('highlight', ['$sce', function ($sce) {
    return function (text, phrase) {
        if (phrase) {
            text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
                    '<span class="highlighted">$1</span>');
        }
        return $sce.trustAsHtml(text);
    };
}]);
;angular.module('adminPanel').provider('AdminPanelConfig', function() {
    var imgLoadingRsc = '';
    var pagination = 11;
    var defaultFormMessages = {
        email: 'Este campo debe ser un email',
        max: 'Se excedió el numero máximo',
        maxlength: 'El campo tiene demasiados carácteres',
        min: 'No se alcanza el numero minimo de carácteres',
        minlength: 'El texto ingresado es muy corto',
        number: 'Este campo debe ser numérico',
        pattern: 'Este campo no cumple con el patrón especificado',
        required: 'Este campo es requerido',
        url: 'Este campo debe ser una url',
        date: 'Este campo debe ser unna fecha',
        datetimelocal: 'Este campo debe ser una fecha',
        time: 'Ingresa una hora válida',
        week: 'Ingresa una semana válida',
        month: 'El mes no es válido'
    };
    var navigationItems = {};
    
    /**
     * @param {String} path Ruta hacia el archivo de la imagen usada para carga
     */
    this.setImgLoadingIconPath = function (path) {
        imgLoadingRsc = path;
        return this;
    };
    
    /**
     * @param {Integer} pages Paginas por default al listar elementos de una entidad
     */
    this.setPagesPagination = function(pages) {
        pagination = pages;
        return this;
    };
    
    /**
     * @param {Object} msgs Objeto cuyas propiedades son los nombres de los validation tokens y los valores 
     * son los mensajes
     */
    this.setDefaultFormMessenges = function(msgs) {
        for(var key in msgs) {
            defaultFormMessages[key] = msgs[key];
        }
        return this;
    };
    
    /**
     * @param {type} items Objeto que contiene la conformacion del menu
     * var items = {
     *   'Item menu name': {
     *     link: 'link',
     *     items: {
     *       'Nested item menu':'link'
     *     }
     *   },
     *   ...
     * }
     */
    this.setNavigationItems = function(items) {
        navigationItems = angular.copy(items);
        for(var item in navigationItems) {
            navigationItems[item].link = (navigationItems[item].link) ? '#!' + navigationItems[item].link : '#';
            for(var nestedItem in navigationItems[item].items) {
                navigationItems[item].items[nestedItem] = '#!' + navigationItems[item].items[nestedItem];
            }
        }
        return this;
    };
    
    this.$get = [
        function () {
            return {
                imgLoadingRsc: imgLoadingRsc,
                pagination: pagination,
                defaultFormMessages: defaultFormMessages,
                navigationItems: navigationItems
            };
        }
    ];
});;angular.module('adminPanel').run(['$templateCache', function ($templateCache) {
  $templateCache.put("admin-panel.template.html",
    "<div ap-user><div class=wrapper-header><top-bar></top-bar></div><div id=parent><navigation></navigation><div id=content><div class=transition ng-view></div></div></div></div>");
  $templateCache.put("components/navigation/navigation.template.html",
    "<ul class=\"vertical menu\"><li ng-repeat=\"(name, item) in items\"><a href={{item.link}} ng-bind=name></a><ul ng-if=item.items class=\"vertical menu nested\"><li ng-repeat=\"(nestedItemName, nestedItemLink) in item.items\"><a href={{nestedItemLink}} ng-bind=nestedItemName></a></li></ul></li></ul>");
  $templateCache.put("components/top-bar/top-bar.template.html",
    "<div class=top-bar><div class=top-bar-right><ul class=menu><li><button type=button class=button ng-click=clickBtn()>Cerrar Sesión</button></li></ul></div></div>");
  $templateCache.put("directives/accordion/accordion.template.html",
    "<div ng-if=addButtonText class=\"row column\"><button type=button class=\"button secondary\" ng-click=addElement() ng-bind=addButtonText></button></div><div class=accordion ng-transclude></div>");
  $templateCache.put("directives/accordion/accordionItem.template.html",
    "<div class=accordion-top><button type=button class=accordion-title ng-click=toggleTab() ng-bind=title></button><div class=accordion-button><button type=button ng-if=deleteButton class=\"button alert\" ng-click=deleteElement()><i class=\"fa fa-remove\"></i></button></div></div><div class=accordion-content data-tab-content ng-transclude></div>");
  $templateCache.put("directives/box/box.template.html",
    "<div class=card><button ng-if=closeButton class=close-button type=button ng-click=close()><span>&times;</span></button><div class=card-divider><h5 ng-bind=title></h5></div><div class=card-section><div ng-if=message class=callout ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\" ng-bind=message.message></div><div ng-transclude ap-load></div><div class=pager></div></div></div>");
  $templateCache.put("directives/dateTimePicker/dateTimePicker.template.html",
    "<div class=input-group><span class=\"input-group-label prefix\"><i class=\"fa fa-calendar\"></i></span><input class=\"input-group-field ap-date\" type=text readonly><span class=input-group-label>Hs</span><input class=input-group-field type=number style=width:60px ng-model=hours ng-change=changeHour()><span class=input-group-label>Min</span><input class=input-group-field type=number style=width:60px ng-model=minutes ng-change=changeMinute()></div>");
  $templateCache.put("directives/form/fieldErrorMessages.template.html",
    "<div ng-repeat=\"error in errors\" ng-show=error.expresion ng-bind=error.message></div>");
  $templateCache.put("directives/load/load.template.html",
    "<div ng-show=loading class=ap-load-image><img ng-src={{path}}></div><div ng-hide=loading class=ap-load-content><div ng-if=message class=callout ng-class=\"{'success':message.type === 'success','warning':message.type === 'warning','alert':message.type === 'error'}\" ng-bind=message.message></div><div></div></div>");
  $templateCache.put("directives/load/loadingImg.template.html",
    "<img ng-src={{path}}>");
  $templateCache.put("directives/msfCoordenadas/msfCoordenadas.template.html",
    "<div class=\"row column\"><div class=\"callout secondary text-center\">Podés obtener los datos de<u><a href=https://www.santafe.gov.ar/idesf/servicios/generador-de-coordenadas/tramite.php target=_blank>acá</a></u></div></div><div class=\"row column\"><label ng-class=\"{'is-invalid-label':error}\"><input style=margin-bottom:3px type=text ng-class=\"{'is-invalid-input':error}\" ng-model=coordenadas ng-change=cambioCoordeandas()><span ng-class=\"{'is-visible':error}\" style=margin-top:7px class=form-error>El campo ingresado contiene errores.</span></label></div><div class=row><div class=\"columns small-12 large-6\"><label>Latitud <input type=text ng-value=model.latitud readonly></label></div><div class=\"columns small-12 large-6\"><label>Longitud <input type=text ng-value=model.longitud readonly></label></div></div>");
  $templateCache.put("directives/pagination/pagination.template.html",
    "<ul class=\"pagination text-center\" role=navigation><li ng-if=pagination.activeLastFirst class=pagination-previous ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.changePage(1)></a></li><li ng-class=\"{'disabled': !pagination.enablePreviousPage}\"><a ng-if=pagination.enablePreviousPage ng-click=pagination.previousPage()>&lsaquo;</a><span ng-if=!pagination.enablePreviousPage>&lsaquo;</span></li><li ng-repeat=\"page in pagination.pages track by $index\" ng-class=\"{'current':page === pagination.currentPage}\"><a ng-if=\"page !== pagination.currentPage\" ng-bind=page ng-click=pagination.changePage(page)></a><span ng-if=\"page === pagination.currentPage\" ng-bind=page></span></li><li ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.nextPage()>&rsaquo;</a><span ng-if=!pagination.enableNextPage>&rsaquo;</span></li><li ng-if=pagination.activeLastFirst class=pagination-next ng-class=\"{'disabled': !pagination.enableNextPage}\"><a ng-if=pagination.enableNextPage ng-click=pagination.changePage(pagination.pageCount)></a></li></ul>");
  $templateCache.put("directives/select/select.template.html",
    "<div class=input-group><input class=input-group-field type=text ng-model=input ng-change=onInputChange() ng-focus=onFocus() ng-blur=onBlur()><div class=input-group-button><button type=button class=\"button secondary\" ng-click=buttonClick()><span class=caret></span></button></div></div><div class=dropdown-ap><ul ng-if=loading class=list-group><li style=font-weight:700>Cargando...</li></ul><ul ng-if=\"!loading && options.length > 0\" class=list-group><li ng-repeat=\"option in options\" ng-bind-html=\"option.name | highlight:input\" ng-click=optionSelected(option)></li></ul><ul ng-if=\"!loading && options.length === 0\" class=list-group><li style=font-weight:700>No hay resultados</li></ul><ul ng-if=enableNewButton class=\"list-group new\"><li ng-click=newObject()><span class=\"fa fa-plus\"></span><span>Nuevo</span></li></ul></div>");
}]);
