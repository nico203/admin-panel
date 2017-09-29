angular.module('adminPanel').directive('apImageLoader', [
    function(){
        return {
            require: 'ngModel',
            restrict: 'E',
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-image-loader row columns');
                var imageElement = elem.find('img');
                scope.imagePath = null;

                var imageFileMimeType = /^image\//;
                
                function onLoadFile(event) {
                    var file = event.target.files[0];
                    if(!file || !imageFileMimeType.test(file.type)) return;
                    console.log('file', file);
                    
                    var reader = new FileReader();
                    reader.onload = (function(img) {
                        console.log('img', img);
                        return function(e) {
                            console.log('e',e);
                            scope.$apply(function() {
                                scope.imagePath = e.target.result;
                            });
                        };
                    })(imageElement);
                    reader.readAsBinaryString(file);
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
