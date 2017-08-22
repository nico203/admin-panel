angular.module('adminPanel').directive('apAccordionItemTitle', ['$parse',function($parse){
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
}]);