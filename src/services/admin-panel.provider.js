angular.module('adminPanel').provider('AdminPanelConfig', function() {
    var imgLoadingRsc = '';
    var pagination = 11;
    var defaultFormMessages = {
        email: 'Este campo debe ser un email',
        max: 'Se excedió el numero máximo',
        maxlength: 'El campo tiene demasiados carácteres',
        min: 'No se alcanza el numero minimo de carácteres',
        minlength: 'El texto ingresado es muy corto',
        number: 'Este campo debe ser numérico',
        pattern: 'Este campo no cumple con el patrón especificado',
        required: 'Este campo es requerido',
        url: 'Este campo debe ser una url',
        date: 'Este campo debe ser unna fecha',
        datetimelocal: 'Este campo debe ser una fecha',
        time: 'Ingresa una hora válida',
        week: 'Ingresa una semana válida',
        month: 'El mes no es válido'
    };
    var navigationItems = {};
    
     var windowMinSizes = {
        medium: 640,
        large: 1024
    };
    
    this.setWindowMinSizes = function(val) {
        windowMinSizes = val;
    };
    
    /**
     * @param {String} path Ruta hacia el archivo de la imagen usada para carga
     */
    this.setImgLoadingIconPath = function (path) {
        imgLoadingRsc = path;
        return this;
    };
    
    /**
     * @param {Integer} pages Paginas por default al listar elementos de una entidad
     */
    this.setPagesPagination = function(pages) {
        pagination = pages;
        return this;
    };
    
    /**
     * @param {Object} msgs Objeto cuyas propiedades son los nombres de los validation tokens y los valores 
     * son los mensajes
     */
    this.setDefaultFormMessenges = function(msgs) {
        for(var key in msgs) {
            defaultFormMessages[key] = msgs[key];
        }
        return this;
    };
    
    /**
     * @param {type} items Objeto que contiene la conformacion del menu
     * var items = {
     *   'Item menu name': {
     *     link: 'link',
     *     items: {
     *       'Nested item menu':'link'
     *     }
     *   },
     *   ...
     * }
     */
    this.setNavigationItems = function(items) {
        navigationItems = angular.copy(items);
        for(var item in navigationItems) {
            navigationItems[item].link = (navigationItems[item].link) ? '#!' + navigationItems[item].link : '#';
            for(var nestedItem in navigationItems[item].items) {
                navigationItems[item].items[nestedItem] = '#!' + navigationItems[item].items[nestedItem];
            }
        }
        return this;
    };
    
    this.$get = [
        function () {
            return {
                imgLoadingRsc: imgLoadingRsc,
                pagination: pagination,
                defaultFormMessages: defaultFormMessages,
                navigationItems: navigationItems,
                windowMinSizes: windowMinSizes
            };
        }
    ];
});