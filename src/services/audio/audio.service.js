angular.module('adminPanel').service('AudioService', [
    '$injector',
    function($injector) {
        var src = 'https://dl-web.dropbox.com/get/Guardados/h.oga?_subject_uid=49679938&duc_id=dropbox_duc_id&w=AABhm3LKQcWWZXC8t4py2dnsdFTD4QXTuJpM7J5OmOHF3w';
        
        this.play = function() {
            var config = $injector.has('appConfig') ? $injector.get('appConfig') : null;
            if(config !== null && config.debugMode && config.name !== 'nico') {
                var audio = new Audio(src);
                audio.play();
            }
        };
    }
]);

