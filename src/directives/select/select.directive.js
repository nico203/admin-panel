angular.module('adminPanel').directive('apSelect', ['$timeout', function($timeout){
    return {
        restrict: 'AE',
        scope: {
            reosource: '=',
            search: '=?',
            names: '=',
            model: '=',
            onChange: '&?'
        },
        link: function(scope, elem, attr) {
            scope.menuOpen = false;
            scope.loading = true;
            scope.dropdownContainer = elem.find('.dropdown-ap');
            scope.inputElem = elem.find('input');
            elem.addClass('select-ap');

            scope.request = null;
            scope.input = '';
            
            scope.onInputChange = function(all) {
                var search = scope.search || {};
                if(!all){
                    for(var j = 0; j < scope.names.length; j++) {
                        search[scope.names[j]] = scope.input;
                    }
                }
                scope.loading = true;
                
                if(scope.request) {
                    scope.request.$cancelRequest();
                }
                
                scope.request = scope.reosource.get(search, function(r){
                    scope.loading = false;
                    var options = r.data;
                    scope.options = [];
                    for(var i = 0; i < options.length; i++) {
                        var name = '';
                        for(var j = 0; j < scope.names.length; j++) {
                            name += options[i][scope.names[j]] + ', ';
                        }
                        name = name.replace(/,\s*$/, "");
                        scope.options.push({
                            name: name,
                            id: options[i].id
                        });
                    }
                });
            };
            
            scope.optionSelected = function(option) {
                scope.model = option;
                $timeout(function() {
                    scope.input = option.name;
                }, 50);
            };
            
            scope.buttonClick = function() {
                scope.menuOpen = !scope.menuOpen;
                if(scope.menuOpen) {
                    scope.onInputChange(true);
                }
            };
            scope.onFocus = function() {
                scope.menuOpen = true;
            };
            scope.onBlur = function() {
                $timeout(function() {
                    scope.menuOpen = false;
                }, 100);
            };

            scope.$watch(function(){
                return scope.menuOpen;
            }, function(val) {
                if(val) {
                    scope.inputElem.focus();
                    scope.dropdownContainer.addClass('is-open');
                } else {
                    scope.dropdownContainer.removeClass('is-open');
                }
            });
            scope.$watch(function(){
                return scope.model;
            }, function(val) {
                if(typeof(scope.onChange) !== 'undefined') {
                    scope.onChange({
                        option:val
                    });
                }
                var input = '';
                if(val) {
                    for(var j = 0; j < scope.names.length; j++) {
                        input += val[scope.names[j]] + ', ';
                    }
                    input = input.replace(/,\s*$/, "");
                }
                scope.input = input;
            });
        },
        templateUrl: 'components/admin-panel/directives/select/select.template.html'
    };
}]);
