angular.module('adminPanel').service('WindowResize', [
    'AdminPanelConfig','$rootScope', '$window', '$timeout',
    function(AdminPanelConfig,$rootScope,$window,$timeout) {
        //Pantalla actual
        var currentViewport = null;
        var windowMinSizes = AdminPanelConfig.windowMinSizes;

        //Primero vemos que tamaño tiene la pantalla al cargar la pagina
        var calcViewport = function (width) {
            var size = 'small';
            if (width > windowMinSizes.medium) {
                size = 'medium';
            }
            if (width > windowMinSizes.large) {
                size = 'large';
            }
            if (currentViewport !== size) {
                currentViewport = size;
                $rootScope.$broadcast('viewportChange', size);
            }
        };

        angular.element($window).on('resize', function () {
            calcViewport($window.innerWidth);
        });

        return {
            init: function () {
                //se pone el timeout para terminar el ciclo $digest
                $timeout(function () {
                    calcViewport($window.innerWidth);
                }, 100);
            },
            //al iniciar cada componente deberia llamar a este metodo para elegir el comportamiento segun 
            //la el tipo de pantalla del dispositivo
            getCurrentViweport: function () {
                return currentViewport;
            }
        };
    }
]);