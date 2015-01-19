/**
 * @namespace
 */
Subclass.Module = {};

/**
 * @class
 * @constructor
 * @description
 *
 * The class which allows to create Subclass module.
 * It's a structural unit that allows to split the project on multiple parts.
 * The main goal of current class is to provide extensibility of the project
 * by plug-ins (other modules which were marked as plug-ins).<br /><br />
 *
 * Using this class you can get access to module configuration, event manager,
 * class manager, property manager, parameter manager, service manager
 * and make all manipulations whatever you need.
 *
 * @throws {Error}
 *      Throws if was missed or is not a string the module name
 *
 * @param {string} moduleName
 *      A name of creating module
 *
 * @param {string[]} [moduleDependencies=[]]
 *      Array with names of another modules which are plugins for current one
 *
 * @param {Object} [moduleConfigs={}]
 *      Module configuration object. Allowed configs are: <pre>
 *
 * plugin       {boolean}   opt   false  Tells that current module is
 *                                       a plugin and its onReady callback
 *                                       will be called only after this
 *                                       module will be included in main
 *                                       module. If "plugin" is true the
 *                                       "autoload" option automatically
 *                                       sets in false and can't be changed.
 *
 * pluginOf     {string}    opt          Specifies parent module to which
 *                                       current one belongs to. If its sets
 *                                       in true the "plugin" option will
 *                                       atomatically sets in true.
 *
 * autoload     {boolean}   opt   true   Enables class autoload or not.
 *                                       It's true by default
 *
 * rootPath     {string}    opt          The path to root directory of the
 *                                       project. It's required if autoload
 *                                       parameter value is true.
 *
 * files        {string[]}  opt          Array of JS file names. It's actual
 *                                       if "autoload" option is switched on.
 *
 * dataTypes    {Object}    opt          Object, which keys will be type
 *                                       names (alias) and value will
 *                                       be its definitions.
 *
 * parameters   {Object}    opt          Object with parameters which can
 *                                       be used in service definitions
 *                                       or in any other places,
 *                                       i.e in classes.
 *
 * services     {Object}    opt          List of service definitions.
 *
 * onReady      {Function}  opt          Callback that will be invoked when
 *                                       all module classes will be loaded.
 *
 * onReadyCall  {boolean}   opt   true   Allows specify whether onReady callbacks
 *                                       should be invoked automatically
 *                                       when the module will ready
 *
 * </pre>
 */
Subclass.Module.Module = (function()
{
    /**
     * @alias Subclass.Module.Module
     */
    function Module(moduleName, moduleDependencies, moduleConfigs)
    {
        var $this = this;

        if (!moduleName || typeof moduleName != 'string') {
            throw new Error('The module name was not specified.');
        }
        if (!moduleConfigs) {
            moduleConfigs = {};
        }
        if (!moduleDependencies) {
            moduleDependencies = [];
        }

        /**
         * Name of the module
         *
         * @type {string}
         * @private
         */
        this._name = moduleName;

        /**
         * Parent module (if current one is a plugin relative to parent module)
         *
         * @type {(Subclass.Module.Module|null)}
         * @private
         */
        this._parent = null;

        /**
         * Module public api
         *
         * @type {Subclass.Module.ModuleAPI}
         * @private
         */
        this._api = new Subclass.Module.ModuleAPI(this);

        /**
         * Event manager instance
         *
         * @type {Subclass.Event.EventManager}
         * @private
         */
        this._eventManager = new Subclass.Event.EventManager(this);

        // Registering events

        this.getEventManager()
            .registerEvent('onReady')
            .registerEvent('onReadyAfter')
            .registerEvent('onAddPlugin')
        ;

        /**
         * Collection of modules
         *
         * @type {Subclass.Module.ModuleManager}
         * @private
         */
        this._moduleManager = new Subclass.Module.ModuleManager(this, moduleDependencies);

        /**
         * Property manager instance
         *
         * @type {Subclass.Property.PropertyManager}
         * @private
         */
        this._propertyManager = new Subclass.Property.PropertyManager(this);

        /**
         * Class manager instance
         *
         * @type {Subclass.Class.ClassManager}
         * @private
         */
        this._classManager = new Subclass.Class.ClassManager(this);
        this._classManager.initialize();

        /**
         * Service manager instance
         *
         * @type {Subclass.Service.ServiceManager}
         * @private
         */
        this._serviceManager = new Subclass.Service.ServiceManager(this);

        /**
         * Parameter manager instance
         *
         * @type {Subclass.Parameter.ParameterManager}
         * @private
         */
        this._parameterManager = new Subclass.Parameter.ParameterManager(this);

        /**
         * Module configuration
         *
         * @type {Subclass.Module.ModuleConfigs}
         * @private
         */
        this._configManager = new Subclass.Module.ModuleConfigs(this);
        this.setConfigs(moduleConfigs);

        /**
         * Tells that module is ready
         *
         * @type {boolean}
         * @private
         */
        this._ready = false;

        /**
         * Tells if onReady callbacks was triggered
         *
         * @type {boolean}
         * @private
         */
        this._onReadyTriggered = false;


        // Adding event listeners

        var eventManager = this.getEventManager();

        eventManager.getEvent('onLoadingEnd').addListener(function() {
            $this.setReady();
        });

        eventManager.getEvent('onAddPlugin').addListener(function(pluginModule) {
            var pluginEventManager = pluginModule.getEventManager();

            if (pluginModule.getClassManager().isLoading()) {
                return;
            }
            if (!$this.isOnReadyTriggered()) {
                var onReadyAfter = eventManager.getEvent('onReadyAfter');

                onReadyAfter.addListener(function() {
                    pluginEventManager.getEvent('onLoadingEnd').triggerPrivate();
                });

            } else {
                pluginEventManager.getEvent('onLoadingEnd').triggerPrivate();
            }
        });
    }

    /**
     * Returns name of the module
     *
     * @method getName
     * @memberOf Subclass.Module.Module.prototype
     * @returns {string}
     */
    Module.prototype.getName = function()
    {
        return this._name;
    };

    /**
     * Sets parent module.<br />
     * Allows to specify that the current module is a plugin relative to the parent module
     *
     * @method setParent
     * @memberOf Subclass.Module.Module.prototype
     * @throws {Error} Throws error if was specified not valid argument
     *
     * @param {(Subclass.Module.Module|null)} parentModule
     *      The parent module instance
     */
    Module.prototype.setParent = function(parentModule)
    {
        if (parentModule !== null && !(parentModule instanceof Subclass.Module.Module)) {
            throw new Error('Invalid parent module. It must be instance of "Subclass.Module.Module".');
        }
        this._parent = parentModule;
    };

    /**
     * Returns parent module
     *
     * @method getParent
     * @memberOf Subclass.Module.Module.prototype
     * @returns {(Subclass.Module.Module|null)}
     */
    Module.prototype.getParent = function()
    {
        return this._parent;
    };

    /**
     * Checks whether current module belongs to another module,
     * i.e. is a plugin relative to another module
     *
     * @method hasParent
     * @memberOf Subclass.Module.Module.prototype
     * @returns {boolean}
     */
    Module.prototype.hasParent = function()
    {
        return !!this._parent;
    };

    /**
     * Returns the root parent module.<br /><br />
     *
     * If module is a plugin it holds a link to the parent module.
     * If parent in turn has a parent and so on, the module which is on the top
     * of the inheritance chain is called a root module.
     *
     * @method getRoot
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Module.Module}
     */
    Module.prototype.getRoot = function()
    {
        var parent = this;

        if (arguments[0] && arguments[0] instanceof Subclass.Module.Module) {
            parent = arguments[0];
        }
        if (parent.hasParent()) {
            parent = parent.getRoot(parent.getParent());
        }
        return parent
    };

    /**
     * Checks whether current module is root module,
     * i.e. has a parent module and is a plugin.
     *
     * @method isRoot
     * @memberOf Subclass.Module.Module.prototype
     * @returns {boolean}
     */
    Module.prototype.isRoot = function()
    {
        return !this.hasParent() && !this.getConfigManager().isPlugin();
    };

    /**
     * Returns the public api of the module which
     * is an instance of class Subclass.Module.ModuleAPI
     *
     * @method getAPI
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Module.ModuleAPI}
     */
    Module.prototype.getAPI = function()
    {
        return this._api;
    };

    /**
     * The same as the {@link Subclass.Module.ModuleConfigs#setConfigs}
     *
     * @method setConfigs
     * @memberOf Subclass.Module.Module.prototype
     */
    Module.prototype.setConfigs = function(configs)
    {
        this.getConfigManager().setConfigs(configs);
    };

    /**
     * Returns an instance of manager that holds and processes module configuration.
     *
     * @method getConfigManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Module.ModuleConfigs}
     */
    Module.prototype.getConfigManager = function()
    {
        return this._configManager;
    };

    /**
     * Returns an instance of manager that allows to register new events,
     * subscribe listeners and triggers them at the appointed time
     *
     * @method getEventManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Event.EventManager}
     */
    Module.prototype.getEventManager = function()
    {
        return this._eventManager;
    };

    /**
     * Returns an instance of manager that holds and can process all plugins (modules which
     * names were specified earlier in module constructor as moduleDependencies)
     * and link on this module
     *
     * @method getModuleManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Module.ModuleManager}
     */
    Module.prototype.getModuleManager = function()
    {
        return this._moduleManager;
    };

    /**
     * Returns class manager instance that allows to register, process, and get
     * classes of different type: Class, AbstractClass, Interface, Trait, Config
     *
     * @method getClassManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Class.ClassManager}
     */
    Module.prototype.getClassManager = function()
    {
        return this._classManager;
    };

    /**
     * Returns an instance of property manager which allows to register
     * custom data types and creates typed property instance by its definition.
     *
     * @method getPropertyManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Property.PropertyManager}
     */
    Module.prototype.getPropertyManager = function()
    {
        return this._propertyManager;
    };

    /**
     * Returns an instance of parameter manager which allows to register parameters,
     * set and get its values throughout the project
     *
     * @method getParameterManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Parameter.ParameterManager}
     */
    Module.prototype.getParameterManager = function()
    {
        return this._parameterManager;
    };

    /**
     * Returns an instance of service manager which allows to register, build and
     * get services throughout the project
     *
     * @method getServiceManager
     * @memberOf Subclass.Module.Module.prototype
     * @returns {Subclass.Service.ServiceManager}
     */
    Module.prototype.getServiceManager = function()
    {
        return this._serviceManager;
    };

    /**
     * The same as the {@link Subclass.Module.ModuleConfigs#setOnReady}
     *
     * @method onReady
     * @memberOf Subclass.Module.Module.prototype
     */
    Module.prototype.onReady = function(callback)
    {
        this.getConfigManager().setOnReady(callback);
    };

    /**
     * Invokes registered onReady callback functions forcibly.<br /><br />
     *
     * If current module contains plug-ins then will be invoked onReady callbacks
     * from current module first and then will be invoked onReady callbacks
     * from plug-ins in order as they were added to the current module.
     *
     * @method triggerOnReady
     * @memberOf Subclass.Module.Module.prototype
     */
    Module.prototype.triggerOnReady = function()
    {
        this.getEventManager().getEvent('onReady').trigger();
        this._onReadyTriggered = true;
    };

    /**
     * Reports whether the onReady event was ever triggered in current module
     *
     * @returns {boolean}
     */
    Module.prototype.isOnReadyTriggered = function()
    {
        return this._onReadyTriggered;
    };

    /**
     * Brings module to ready state and invokes registered onReady callback functions.
     * It can be invoked only once otherwise nothing will happen.
     *
     * @method setReady
     * @memberOf Subclass.Module.Module.prototype
     */
    Module.prototype.setReady = function()
    {
        var configManager = this.getConfigManager();

        if (
            configManager.isPlugin()
            && (
                !this.hasParent()
                || (
                    this.hasParent()
                    && !this.getRoot().isReady()
                )
            )
        ) {
            return;
        }
        if (this.getClassManager().isLoadStackEmpty()) {
            this._ready = true;

            if (configManager.isOnReadyAutoCall()) {
                this.triggerOnReady();
                this.getEventManager().getEvent('onReadyAfter').trigger();
            }
        }
    };

    /**
     * Checks if current class manager instance is ready and was
     * initialized by invoking onReady registered callback functions
     *
     * @method isReady
     * @memberOf Subclass.Module.Module.prototype
     * @returns {boolean}
     */
    Module.prototype.isReady = function()
    {
        return this._ready;
    };

    /**
     * Allows to add plug-in to the current module.
     * If specified the second argument it means that first
     * will be loaded the specified files and then the plug-in module
     * will be added to current module and will be invoked
     * it onReady callback functions.
     *
     * @method addPlugin
     * @memberOf Subclass.Module.Module.prototype
     *
     * @param {string} moduleName
     *      The name of the module which you want to add to the current one as a plug-in
     *
     * @param {(Array.<Object>|string)} [moduleFiles]
     *      A file name or an array of file names which is needed for working plug-in module.
     *      These files will load first before the plug-in module will be added to the current module.
     *
     * @param {Function} [callback]
     *      The callback function which will be invoked when plug-in module becomes ready.
     *      It is actual only if the module files (the second argument) was specified.
     *      Otherwise it will never be invoked.
     */
    Module.prototype.addPlugin = function(moduleName, moduleFiles, callback)
    {
        var $this = this;

        if (!moduleName || typeof moduleName != 'string') {
            throw new Error('Missed or invalid the module name "' + moduleName + '".');

        } else if (
            Subclass.issetModule(moduleName)
            && Subclass.getModule(moduleName).getParentModule()
        ) {
            throw new Error('The module "' + moduleName + '" is already added to another module as a plugin.');
        }
        if (moduleFiles && typeof moduleFiles == 'string') {
            moduleFiles = [moduleFiles];
        }
        if (moduleFiles && !Array.isArray(moduleFiles)) {
            throw new Error(
                'Specified invalid module files. ' +
                'It must be a string or an array of strings.'
            );
        }
        if (callback && typeof callback != 'function') {
            throw new Error('Specified invalid callback. It must be a function.');
        }
        if (moduleFiles) {
            Subclass.Tools.loadJS(moduleFiles.shift(), function loadCallback() {
                if (Subclass.Tools.isEmpty(moduleFiles)) {
                    if (callback) {
                        var module = Subclass.getModule(moduleName).getModule();
                        var moduleEventManager = module.getEventManager();

                        moduleEventManager.getEvent('onReady').addListener(function() {
                            callback();
                        });
                    }
                    $this.addPlugin(moduleName);

                } else {
                    return Subclass.Tools.loadJS(
                        moduleFiles.shift(),
                        loadCallback
                    );
                }
            });
            return;
        }

        var moduleManager = this.getModuleManager();
            moduleManager.addDependency(moduleName);

        if (this.isReady()) {
            var pluginModule = Subclass.getModule(moduleName).getModule();
            var eventManager = this.getEventManager();

            eventManager.getEvent('onAddPlugin').triggerPrivate(pluginModule);
        }
    };

    return Module;

})();