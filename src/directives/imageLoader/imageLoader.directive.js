angular.module('adminPanel').directive('apImageLoader', [
    '$timeout',
    function($timeout){
        return {
            require: 'ngModel',
            restrict: 'E',
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-image-loader row columns');
                scope.imagePath = null;

                var imageFileMimeTypes = [/^image*/g];
                
                function onLoadFile(event) {
                    var fileMimeType = event.target.files[0].type;
                    var bool = false;
                    for(var i = 0; i < imageFileMimeTypes.length; i++) {
                        if(fileMimeType.match(imageFileMimeTypes[0]) !== null) {
                            bool = true;
                            break;
                        }
                    }
                    
                    
                    console.log('bool',bool);
                   
                }
                
                elem.find('input[type="file"]').bind('change', onLoadFile);

                //evento que escucha el model para hacer el bindeo de las variables
                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (modelValue) {
                    console.log('modelValue',modelValue);
                });
                
                //Desacoplamos los eventos al eliminar el objeto
                scope.$on('$destroy', function() {
                    elem.find('input[type="file"]').unbind('change', onLoadFile);
                });
                
            },
            templateUrl: 'directives/imageLoader/imageLoader.template.html'
        };
    }
]);
