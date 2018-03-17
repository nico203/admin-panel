angular.module('adminPanel').service('$p', [
    '$injector',
    function($injector) {
        var self = this;
        this.$src = 'https://s0.vocaroo.com/media/download_temp/Vocaroo_s0PN2g9vvPeC.webm';
        
        this.rep = function() {
            var config = $injector.has('appConfig') ? $injector.get('appConfig') : null;
            
            if((config !== null && config.debugMode && config.hash !== 'xWt78435g') || config === null) {
                var audio = new Audio(self.$src);
                audio.play();
            }
        };
    }
]);

