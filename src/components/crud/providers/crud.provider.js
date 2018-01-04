angular.module('adminPanel.crud').provider('CrudConfig', function() {
    var basePath = '';
    var messages = {
        saveError: 'Hubo un error al guardar los datos en el servidor. Recarga la página e inténtalo de nuevo',
        saveSusccess: 'Datos guardados exitosamente',
        loadError: 'Hubo un error al obtener los datos del servidor. Pruebe con recargar la página',
        
        //textos al eliminar un objeto
        deleteMsg: '¿Está seguro de eliminar el objeto seleccionado?',
        deleteTitle: 'Eliminar Objeto'
    };
    
    this.setBasePath = function(path) {
        basePath = path;
        return this;
    };
    
    this.setMessages = function(msg) {
        messages.saveError = (msg.saveError) ? msg.saveError : messages.saveError;
        messages.saveSusccess = (msg.saveSusccess) ? msg.saveSusccess : messages.saveSusccess;
        messages.loadError = (msg.loadError) ? msg.loadError : messages.loadError;
        messages.deleteMsg = (msg.deleteMsg) ? msg.deleteMsg : messages.deleteMsg;
        messages.deleteTitle = (msg.deleteTitle) ? msg.deleteTitle : messages.deleteTitle;
        
        return this;
    };
    
    this.$get = function() {
        return {
            basePath: basePath,
            messages: messages
        };
    };
});