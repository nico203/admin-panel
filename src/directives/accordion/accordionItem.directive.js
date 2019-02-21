angular.module('adminPanel').directive('apAccordionItem', function(){
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
