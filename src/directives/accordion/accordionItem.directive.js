angular.module('adminPanel').directive('apAccordionItem', function(){
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
