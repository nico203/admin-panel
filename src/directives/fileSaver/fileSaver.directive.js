angular.module('adminPanel').directive('apFileSaver', [
    '$http', 'CrudConfig',
    function ($http, CrudConfig) {
        return {
            restrict: 'AE',
            scope: {
                url: '@',
                params: '<',
                type: '@',
                value: '@'
            },
            link: function (scope, elem) {
                elem.addClass('ap-file-saver');
                
                var self= this;
                self.button = elem.find('button');
                //Establecemos reportes
                scope.buttonName = scope.value || 'Generar Reporte';
                scope.loading = false;
                
                function doRequest() {
                    scope.loading = true;
                    return $http({
                        url: CrudConfig.basePath + scope.url,
                        method: 'GET',
                        headers: {
                            'Content-type': scope.type
                        },
                        responseType: 'arraybuffer',
                        params: scope.params
                    }).then(function (r) {
                        console.log('resposeuta');
                        console.log(r.data);
                        console.log(r.headers);
                        console.log(r.status);

                        var fileName = r.headers('Content-Disposition').split('filename').pop().replace(/['"=]+/g, '');

                        var blob = new Blob([r.data], {
                            type: scope.type + ";charset=utf-8"
                        });

                        console.log('file', blob);
                        saveAs(blob, fileName);

                    }).finally(function() {
                        scope.loading = false;
                    });
                }

                function clickElem() {
                    doRequest();
                }

                self.button.on('click', clickElem);

                scope.$on('$destroy', function () {
                    self.button.off('click', clickElem);
                });
            },
            templateUrl: 'directives/fileSaver/fileSaver.template.html'
        };
    }
]);
