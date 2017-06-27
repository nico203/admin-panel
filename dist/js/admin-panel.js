angular.module('adminPanel', [
    'ngAnimate'
]);;angular.module('adminPanel').directive('apAccordion',function(){
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
        templateUrl: 'components/admin-panel/directives/accordion/accordion.template.html'
    };
});
;angular.module('adminPanel').directive('apAccordionItem', function(){
    return {
        require: ['^^apAccordion', 'ngModel'],
        restrict: 'AE',
        transclude: true,
        scope: {
            itemTitle: '@?',
            itemTitleFunc: '=?',
            deleteButton: '=?'
        },
        link: function(scope, elem, attr, controller) {
            scope.title = 'hola';
            attr.$set('dataAccordionItem', '');
            elem.addClass('accordion-item is-active');
            controller[0].reInitComponent(); /* Parent controller */
            
            scope.deleteElement = function() {
                controller[0].removeElement(controller[1].$modelValue);
            };
            
            scope.toggleTab = function() {
                controller[0].toggleTab(elem.find('.accordion-content'));
            };
            
            if(scope.itemTitle === undefined) {
                scope.$watch(scope.itemTitleFunc, function(val) {
                    console.log('title',val);
                    scope.title = val;
                });
            } else {
                console.log('itemtitle',scope.itemTitle);
                scope.title = scope.itemTitle;
            }
            
        },
        templateUrl: 'components/admin-panel/directives/accordion/accordionItem.template.html'
    };
});
;//Mirar el componente cars de foundation

angular.module('adminPanel').directive('apBox', ['$rootScope',function($rootScope){
    return {
        restrict: 'AE',
        transclude: true,
        scope: {
            title: '@',
            closeButton: '=?',
            closeIf: '=?',
            init: '&?'
        },
        link: function(scope, elem, attr) {
            elem.addClass('ap-box');
            scope.closeIf = false;
            scope.elem = elem;
//            scope.top = false;
            
            scope.close = function() {
                scope.closeIf = true;
            };
            
            elem.on('mouseenter', function() {
//                scope.top = false;
                scope.elem.removeClass('no-visible');
                $rootScope.$broadcast('box.directive.mouseenter', scope.elem);
            });
            
            scope.$on('box.directive.mouseenter', function(event, elem) {
                if(scope.elem === elem) {
                    return;
                }
                scope.elem.addClass('no-visible');
            });
            
            scope.$watch(function(){
                return scope.closeIf;
            }, function(val){
                if(val) {
                    elem.hide();
                } else {
                    elem.show();
                }
            });
            
            if(scope.init) {
                scope.init();
            }
        },
        templateUrl: 'components/admin-panel/directives/box/box.template.html'
    };
}]);
;angular.module('adminPanel').directive('apDateTimePicker', ['$timeout', function($timeout) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        scope: {
            format: '@?' /* NO TENIDO EN CUENTA */
        },
        link: function(scope, elem, attr, ngModel) {
            elem.addClass('row collapse date ap-datetimepicker');
            scope.hours = 0;
            scope.minutes = 0;
            scope.date = new Date();
            var options = {
                format: 'dd/mm/yyyy',
//                pickTime: true,
                initialDate: scope.date
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
                var h = (hours !== null || hours !== undefined) ? hours : scope.hours;
                var m = (minutes !== null || minutes !== undefined ) ? minutes : scope.minutes;
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
                changeDateTime(scope.date, null, null);
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
        templateUrl: 'components/admin-panel/directives/dateTimePicker/dateTimePicker.template.html'
    };
}]);
;angular.module('adminPanel').directive('apLoad', function(){
    return {
        restrict: 'A',
        transclude: true,
        scope: {},
        link: function(scope, elem, attr) {
            elem.addClass('ap-load');
            scope.loading = false;
            
            scope.show = function(message) {
                scope.loading = false;
                scope.message = message;
            };
            
            scope.hide = function() {
                scope.loading = true;
            };
            
            scope.$on('apLoad:finish', function(e, message) {
                scope.show(message);
            });
            scope.$on('apLoad:start', function() {
                scope.hide();
            });
        },
        controller: function($scope) {
            this.show = function(message) {
                $scope.show(message);
            };
            
            this.hide = function() {
                $scope.hide();
            };
        },
        templateUrl: 'components/admin-panel/directives/load/load.template.html'
    };
});
;angular.module('adminPanel').directive('apSelect', ['$timeout', function($timeout){
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
;angular.module('adminPanel').filter('highlight', ['$sce', function ($sce) {
    return function (text, phrase) {
        if (phrase) {
            text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
                    '<span class="highlighted">$1</span>');
        }
        return $sce.trustAsHtml(text);
    };
}]);
;angular.module('templates-dist', ['directives/accordion/accordion.template.html', 'directives/accordion/accordionItem.template.html', 'directives/box/box.template.html', 'directives/dateTimePicker/dateTimePicker.template.html', 'directives/load/load.template.html', 'directives/select/select.template.html']);

angular.module("directives/accordion/accordion.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/accordion/accordion.template.html",
    "<div ng-if=\"addButtonText\" class=\"row column\">\n" +
    "    <button type=\"button\" class=\"button secondary\" ng-click=\"addElement()\" ng-bind=\"addButtonText\"></button>\n" +
    "</div>\n" +
    "<div class=\"accordion\" ng-transclude></div>");
}]);

angular.module("directives/accordion/accordionItem.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/accordion/accordionItem.template.html",
    "<div class=\"accordion-top\">\n" +
    "    <button type=\"button\" class=\"accordion-title\" ng-click=\"toggleTab()\" ng-bind=\"title\"></button>\n" +
    "    <div class=\"accordion-button\">\n" +
    "        <button type=\"button\" ng-if=\"deleteButton\" class=\"button alert\" ng-click=\"deleteElement()\">\n" +
    "            <i class=\"fa fa-remove\"></i>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<!--a href=\"#\" class=\"accordion-title\" ng-bind=\"itemTitle\"></a-->\n" +
    "<div class=\"accordion-content\" data-tab-content ng-transclude></div>");
}]);

angular.module("directives/box/box.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/box/box.template.html",
    "<div class=\"card\">\n" +
    "    <button ng-if=\"closeButton\" class=\"close-button\" type=\"button\" ng-click=\"close()\">\n" +
    "        <span>&times;</span>\n" +
    "    </button>\n" +
    "    <div class=\"card-divider\">\n" +
    "        <h5 ng-bind=\"title\"></h5>\n" +
    "    </div>\n" +
    "    <div class=\"card-section\" ap-load>\n" +
    "        <div ng-transclude></div>\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("directives/dateTimePicker/dateTimePicker.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/dateTimePicker/dateTimePicker.template.html",
    "<div class=\"input-group\">\n" +
    "    <span class=\"input-group-label prefix\"><i class=\"fa fa-calendar\"></i></span>\n" +
    "    <input class=\"input-group-field ap-date\" type=\"text\" readonly>\n" +
    "    <span class=\"input-group-label\">Hs</span>\n" +
    "    <input class=\"input-group-field\" type=\"number\" style=\"width: 60px;\"\n" +
    "           ng-model=\"hours\"\n" +
    "           ng-change=\"changeHour()\">\n" +
    "    <span class=\"input-group-label\" >Min</span>\n" +
    "    <input class=\"input-group-field\" type=\"number\" style=\"width: 60px;\"\n" +
    "           ng-model=\"minutes\"\n" +
    "           ng-change=\"changeMinute()\">\n" +
    "</div>\n" +
    "    ");
}]);

angular.module("directives/load/load.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/load/load.template.html",
    "<div ng-show=\"loading\" class=\"ap-load-image\">\n" +
    "    <img src=\"img/ring.svg\">\n" +
    "</div>\n" +
    "<div ng-hide=\"loading\" class=\"ap-load-content\">\n" +
    "    <div ng-if=\"message\" class=\"callout\" ng-class=\"{\n" +
    "        'success':message.type === 'success',\n" +
    "        'warning':message.type === 'warning',\n" +
    "        'alert':message.type === 'error'\n" +
    "    }\" ng-bind=\"message.message\"></div>\n" +
    "    <div ng-transclude></div>\n" +
    "</div>");
}]);

angular.module("directives/select/select.template.html", []).run(["$templateCache", function ($templateCache) {
  $templateCache.put("directives/select/select.template.html",
    "<div class=\"input-group\">\n" +
    "    <input class=\"input-group-field\" type=\"text\" ng-model=\"input\" ng-change=\"onInputChange()\"\n" +
    "           ng-focus=\"onFocus()\"\n" +
    "           ng-blur=\"onBlur()\" />\n" +
    "    <div class=\"input-group-button\">\n" +
    "        <button type=\"button\" class=\"button secondary\" ng-click=\"buttonClick()\">\n" +
    "            <span class=\"caret\"></span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"dropdown-ap\">\n" +
    "    <ul ng-if=\"loading\" class=\"list-group\">\n" +
    "        <li style=\"font-weight: bold;\">Cargando...</li>\n" +
    "    </ul>\n" +
    "    <ul ng-if=\"!loading && options.length > 0\" class=\"list-group\">\n" +
    "        <li ng-repeat=\"option in options\" \n" +
    "            ng-bind-html=\"option.name | highlight:input\"\n" +
    "            ng-click=\"optionSelected(option)\"></li>\n" +
    "    </ul>\n" +
    "    <ul ng-if=\"!loading && options.length === 0\" class=\"list-group\">\n" +
    "        <li style=\"font-weight: bold;\">No hay resultados</li>\n" +
    "    </ul>\n" +
    "</div>\n" +
    "");
}]);
