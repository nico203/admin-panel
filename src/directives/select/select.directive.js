angular.module('adminPanel').directive('apSelect', [
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
                
                //inicializamos los nombres que pueden ser un array o una cadena
                var names = [];
                var auxNames = (angular.isArray(scope.names)) ? scope.names : scope.names.split(',');
                for(var i = 0; i < auxNames.length; i++) {
                    //separamos los posibles puntos para denotar las entidades que pueden ser listadas
                    // si es de la forma object.propery se traduce en un array [][] para que pueda ser accedido
                    //sino se copia la cadena
                    var points = auxNames[i].split('.');
                    names.push((points.length === 1) ? points[0] : points);
                }

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
                        for (var j = 0; j < names.length; j++) {
                            var atributo;
                            atributo = angular.isArray(names[j]) ? names[j][names[j].length - 1] : names[j];
                            search[atributo] = scope.input;
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
                            var optionName = '';

                            for (var j = 0; j < names.length; j++) {
                                var name = names[j];
                                
                                optionName += (angular.isArray(name) ? options[i][name[0]][name[1]] : options[i][name]) + ', ';
                            }
                            optionName = optionName.replace(/,\s*$/, "");

                            var obj = options[i];
                            obj.name = optionName;
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
                        for (var j = 0; j < names.length; j++) {
                            var name = names[j];
                            input += (angular.isArray(name) ? val[name[0]][name[1]] : val[name]) + ', ';
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