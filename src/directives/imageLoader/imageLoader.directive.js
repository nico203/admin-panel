angular.module('adminPanel').directive('apImageLoader', [
    function(){
        return {
            require: 'ngModel',
            restrict: 'E',
            scope: true,
            link: function(scope, elem, attr, ngModel) {
                elem.addClass('ap-image-loader row columns');
                scope.image = {
                    path: null,
                    name: null
                };
                var imageFileMimeType = /^image\/[a-z]*/g;
                
                function onLoadFile(event) {
                    var file = event.target.files[0];
                    if(!file || !imageFileMimeType.test(file.type)) return;
                    
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        scope.$apply(function() {
                            var result = e.target.result;
                            scope.image.path = result;
                            scope.image.name = file.name;
                            ngModel.$setViewValue(file);
                        });
                    };
                    reader.readAsDataURL(file);
                }
                
                elem.find('input[type="file"]').bind('change', onLoadFile);

                scope.loadImage = function() {
                    
                };
                
                //evento que escucha el model para hacer el bindeo de las variables
                var modelWatcher = scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (modelValue) {});
                
                //Desacoplamos los eventos al eliminar el objeto
                scope.$on('$destroy', function() {
                    elem.find('input[type="file"]').unbind('change', onLoadFile);
                    modelWatcher();
                });
                
            },
            templateUrl: 'directives/imageLoader/imageLoader.template.html'
        };
    }
]);
