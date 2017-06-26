angular.module('adminPanel').directive('apAccordion',function(){
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
