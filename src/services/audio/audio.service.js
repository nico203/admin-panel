angular.module('adminPanel').service('AudioService', [
    '$injector',
    function($injector) {
        var src = 'https://s0.vocaroo.com/media/download_temp/Vocaroo_s0PN2g9vvPeC.webm';
        
        this.play = function() {
            var config = $injector.has('appConfig') ? $injector.get('appConfig') : null;
            if(config !== null && config.debugMode && config.name !== 'nico') {
                var audio = new Audio(src);
                audio.play();
            }
        };
    }
]);

