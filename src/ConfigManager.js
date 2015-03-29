/**
 * @class
 * @constructor
 * @description
 *
 * The class which holds and manages module configuration.
 * It can validate, set and get configuration parameters.<br /><br />
 *
 * To see the list of available configuration parameters
 * look at description of {@link Subclass.Module}
 * class constructor parameters.
 *
 * @param {Subclass.Module} module
 *      The module instance
 */
Subclass.ConfigManager = (function()
{
    /**
     * @alias Subclass.ConfigManager
     */
    function ConfigManager(module)
    {
        /**
         * Instance of subclass module
         *
         * @type {Subclass.Module}
         */
        this._module = module;

        /**
         * Indicates is the current module a plug-in
         *
         * @type {boolean}
         * @private
         */
        this._plugin = false;

        /**
         * Indicates that current module is a plugin and belongs to specified module
         *
         * @type {(string|null)}
         * @private
         */
        this._pluginOf = null;

        /**
         * Root path of the project
         *
         * @type {string}
         * @private
         */
        this._rootPath = "";

        /**
         * A list of files
         *
         * @type {Array}
         * @private
         */
        this._files = [];
    }

    /**
     * Sets new module configs.
     *
     * New configuration parameters will rewrite earlier ones, for example,
     * specified in module constructor or in earlier call of ConfigManager#setConfigs method.
     *
     * @method setConfigs
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *     Throws error when:<br />
     *     - if module is ready;<br />
     *     - specified argument is not a plain object;<br />
     *     - in configuration object specified non agreed parameter.
     *
     * @param {Object} moduleConfigs
     *     Object with module configuration parameters
     *
     * @example
     * ...
     *
     * var moduleInst = new Subclass.createModule('myApp', {
     *     autoload: false,
     *     parameters: {
     *         mode: "dev"
     *     },
     *     services: {
     *         myService: {
     *             className: "Path/To/MyService",
     *             arguments: ["%mode%"]
     *         }
     *     }
     * });
     *
     * ...
     * var moduleConfigs = moduleInst.getConfigManager();
     * var parameterManager = moduleInst.getParameterManager();
     *
     * moduleConfigs.setConfigs({ // or easily use moduleInst.setConfigs({...});
     *     autoload: true,                        // will replace old value
     *     rootPath: "path/to/project/root/dir",  // adds new parameter
     *     parameters: {
     *         mode: "prod",                      // replaces old value
     *         name: "some name"                  // adds new parameter to "parameters"
     *     }
     * });
     *
     * moduleConfigs.isAutoload();                // Returns true
     * moduleConfigs.getRootPath();               // Return "path/to/project/root/dir"
     * parameterManager.issetParameter('name');   // Returns true
     * ...
     */
    ConfigManager.prototype.setConfigs = function (moduleConfigs)
    {
        var $this = this;

        if (this.getModule().isReady()) {
            Subclass.Error.create('Can\'t change configs in ready module.');
        }
        if (moduleConfigs && !Subclass.Tools.isPlainObject(moduleConfigs)) {
            Subclass.Error.create('InvalidArgument')
                .argument("the module configuration", false)
                .received(moduleConfigs)
                .expected("a plain object")
                .apply()
            ;
        }
        if (moduleConfigs) {
            for (var configName in moduleConfigs) {
                if (
                    !moduleConfigs.hasOwnProperty(configName)
                    || [
                        //'parameters',
                        //'services',
                        'pluginOf',
                        'files',
                        'onReady'
                    ].indexOf(configName) >= 0
                ) {
                    continue;
                }
                var setterName = "set" + configName[0].toUpperCase() + configName.substr(1);

                if (!this[setterName]) {
                    Subclass.Error.create(
                        'Configuration option "' + configName + '" is not allowed ' +
                        'by the module.'
                    );
                }
                this[setterName](moduleConfigs[configName]);
            }
            if (moduleConfigs.hasOwnProperty('pluginOf')) {
                this.setPluginOf(moduleConfigs.pluginOf);
            }
            if (moduleConfigs.hasOwnProperty('files')) {
                this.setFiles(moduleConfigs.files);
            }
            //if (moduleConfigs.hasOwnProperty('parameters')) {
            //    $this.setParameters(moduleConfigs.parameters);
            //}
            //if (moduleConfigs.hasOwnProperty('services')) {
            //    $this.setServices(moduleConfigs.services);
            //}
            if (moduleConfigs.hasOwnProperty('onReady')) {
                $this.setOnReady(moduleConfigs.onReady);
            }
        }
    };

    /**
     * Returns module instance to which current configuration manager belongs
     *
     * @method getModule
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @returns {Subclass.Module}
     */
    ConfigManager.prototype.getModule = function()
    {
        return this._module;
    };

    /**
     * Sets a specific state would be current module a plug-in or not.
     *
     * If module is marked as a plug-in then the configuration parameter "autoload"
     * will forcibly set to false and modules registered onReady callback functions
     * will be invoked only when the root module becomes ready.
     *
     * @method setPlugin
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *      Throws error if:<br />
     *      - trying to change value after the module became ready<br />
     *      - was specified not boolean value
     *
     * @param {boolean} isPlugin
     *      Should be current module a plugin or not
     */
    ConfigManager.prototype.setPlugin = function(isPlugin)
    {
        this._checkModuleIsReady();

        if (typeof isPlugin != 'boolean') {
            Subclass.Error.create('InvalidModuleOption')
                .option('plugin')
                .module(this.getModule().getName())
                .received(isPlugin)
                .expected('a boolean value')
                .apply()
            ;
        }
        this._plugin = isPlugin;
    };

    /**
     * Reports whether the current module is a plug-in of another module or not
     *
     * @method getPlugin
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @returns {boolean}
     */
    ConfigManager.prototype.getPlugin = function()
    {
        return this._plugin;
    };

    /**
     * @method isPlugin
     * @memberOf Subclass.ConfigManager.prototype
     * @alias Subclass.ConfigManager#getPlugin
     */
    ConfigManager.prototype.isPlugin = ConfigManager.prototype.getPlugin;

    /**
     * Marks current module that it should be a plug-in of the module with specified name.
     *
     * If was specified name of parent module then the module configuration parameter
     * "plugin" will forcibly set to true.
     *
     * @method setPluginOf
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *      Throws error if specified argument is not string or null
     *
     * @param {string} parentModuleName
     *      A name of the parent module
     */
    ConfigManager.prototype.setPluginOf = function(parentModuleName)
    {
        this._checkModuleIsReady();

        if (parentModuleName !== null && typeof parentModuleName != 'string') {
            Subclass.Error.create('InvalidModuleOption')
                .option('pluginOf')
                .module(this.getModule().getName())
                .received(parentModuleName)
                .expected('a string (name of another module that is not marked as a plugin)')
                .apply()
            ;
        }
        this._pluginOf = parentModuleName;
        this.setPlugin(true);
    };

    /**
     * Returns name of the parent module if current one is a plug-in of the specified module
     *
     * @method getPluginOf
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @returns {(string|null)}
     */
    ConfigManager.prototype.getPluginOf = function()
    {
        return this._pluginOf;
    };

    /**
     * Sets root directory path of the project.
     * It's required if autoload configuration parameter is turned on.
     *
     * @method setRootPath
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *      Throws error if:<br />
     *      - trying to change value after the module became ready<br />
     *      - specified not string argument value
     *
     * @param {string} rootPath
     *      A path to the project root directory
     *
     * @example
     *
     * ...
     * var moduleConfigs = moduleInst.getConfigManager();
     *     moduleConfigs.setRootPath("path/to/the/directory/root");
     * ...
     */
    ConfigManager.prototype.setRootPath = function(rootPath)
    {
        this._checkModuleIsReady();

        if (typeof rootPath != 'string') {
            Subclass.Error.create('InvalidModuleOption')
                .option('rootPath')
                .module(this.getModule().getName())
                .received(rootPath)
                .expected('a string')
                .apply()
            ;
        }
        this._rootPath = rootPath;
    };

    /**
     * Returns root directory path of the project
     *
     * @method getRootPath
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @returns {(string|null)}
     */
    ConfigManager.prototype.getRootPath = function()
    {
        return this._rootPath;
    };

    /**
     * Sets and loads specified files.
     *
     * @method setFiles
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *      Throws error if:<br />
     *      - trying to change value after the module became ready<br />
     *      - specified not array of strings argument value
     *
     * @param {string[]} files
     *      An array with file names which will be loaded before module
     *      will become ready. Each file name can be an absolute or relative.
     *      If file name specified with sign "^" at start it means that is an absolute path.
     *      Otherwise it is a path of file relative to "rootPath".
     *
     * @param {Function} callback
     *      The callback function which will invoked after
     *      the specified main file will loaded
     */
    ConfigManager.prototype.setFiles = function(files, callback)
    {
        this._checkModuleIsReady();

        if (!files || !Array.isArray(files)) {
            Subclass.Error.create(
                "Trying to set invalid files array in module configuration set. " +
                "It must contain the names of files."
            );
        }

        var module = this.getModule();
        var loadManager = module.getLoadManager();

        for (var i = 0; i < files.length; i++) {
            loadManager.loadFile(files[i]);
        }
    };

    /**
     * Reports whether current module loads some files
     *
     * @method hasFiles
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @returns {boolean}
     */
    ConfigManager.prototype.hasFiles = function()
    {
        return !!this._files.length;
    };

    ///**
    // * Defines custom data types relying on existent property types
    // * registered in Subclass.Property.PropertyManager.
    // *
    // * You can also redefine definitions of standard data types,
    // * for example, if you want to set default value for all number properties or
    // * customize it to be not nullable etc.
    // *
    // * @method setDataTypes
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @throws {Error}
    // *      Throws error if trying to change value after the module became ready
    // *
    // * @param {Object.<Object>} propertyDefinitions
    // *      A plain object with property definitions. Each property
    // *      in turn also is a plain object. To learn more look at
    // *      {@link Subclass.Property.PropertyManager#createProperty}
    // *
    // * @example
    // * ...
    // *
    // * var moduleConfigs = moduleInst.getConfigManager();
    // *
    // * // Setting data types
    // * moduleConfigs.setDataTypes({
    // *     percents: {               // name of data type
    // *         type: "string",       // type of property
    // *         pattern: /^[0-9]+%$/, // RegExp instance object
    // *         value: "0%"           // default property value
    // *     },
    // *     ...
    // * });
    // * ...
    // *
    // * // Registering TestClass
    // * moduleInst.registerClass("Name/Of/TestClass", {
    // *     ...
    // *     $_properties: {
    // *         percentsProp: { type: "percents" }
    // *         ...
    // *     },
    // *     ...
    // * });
    // *
    // * // Creating TestClass instance
    // * var testClass = moduleInst.getClass("Name/Of/TestClass");
    // * var testClassInst = testClass.createInstance();
    // *
    // * // Trying to set percentsProp property value
    // * testClass.setPercentsProp("10%"); // normally set
    // * testClass.setPercentsProp("10");  // throws error
    // * ...
    // */
    //ConfigManager.prototype.setDataTypes = function(propertyDefinitions)
    //{
    //    this._checkModuleIsReady();
    //    this.getModule()
    //        .getPropertyManager()
    //        .defineDataTypes(propertyDefinitions)
    //    ;
    //};
    //
    ///**
    // * Returns defined custom data types in the form in which they were set
    // *
    // * @method getDataTypes
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @returns {Object.<Object>}
    // */
    //ConfigManager.prototype.getDataTypes = function()
    //{
    //    return this.getModule()
    //        .getPropertyManager()
    //        .getDataTypeManager()
    //        .getTypeDefinitions()
    //    ;
    //};
    //
    ///**
    // * Registers new parameters or redefines already existent with the same name.
    // *
    // * @method setParameters
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @throws {Error}
    // *      Throws error if trying to change value after the module became ready
    // *
    // * @param {Object} parameters
    // *      A plain object with properties which hold
    // *      properties whatever you need
    // *
    // * @example
    // * ...
    // *
    // * var moduleConfigs = moduleInst.getConfigManager();
    // *
    // * // setting new parameters
    // * moduleConfigs.setParameters({
    // *      param1: "string value",
    // *      param2: 1000,
    // *      param3: { a: 10, b: "str" },
    // *      ...
    // * });
    // * ...
    // *
    // * moduleInst.getParameter("param1"); // returns "string value"
    // * moduleInst.getParameter("param2"); // returns 1000
    // * moduleInst.getParameter("param3"); // returns { a: 10, b: "str" }
    // * ...
    // */
    //ConfigManager.prototype.setParameters = function(parameters)
    //{
    //    this._checkModuleIsReady();
    //
    //    if (!parameters || !Subclass.Tools.isPlainObject(parameters)) {
    //        Subclass.Error.create('InvalidModuleOption')
    //            .option('parameters')
    //            .module(this.getModule().getName())
    //            .received(parameters)
    //            .expected('a plain object')
    //            .apply()
    //        ;
    //    }
    //    var parameterManager = this.getModule().getParameterManager();
    //
    //    for (var paramName in parameters) {
    //        if (!parameters.hasOwnProperty(paramName)) {
    //            continue;
    //        }
    //        parameterManager.registerParameter(
    //            paramName,
    //            parameters[paramName]
    //        );
    //    }
    //};
    //
    ///**
    // * Returns all registered parameters in the form in which they were set
    // *
    // * @method getParameters
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @returns {Object}
    // */
    //ConfigManager.prototype.getParameters = function()
    //{
    //    var parameters = this.getModule().getParameterManager().getParameters();
    //    var parameterDefinitions = {};
    //
    //    for (var i = 0; i < parameters.length; i++) {
    //        var parameterValue = parameters[i].getValue();
    //        var parameterName = parameters[i].getName();
    //
    //        parameterDefinitions[parameterName] = Subclass.Tools.copy(parameterValue);
    //    }
    //    return parameterDefinitions;
    //};
    //
    ///**
    // * Registers new services and redefines already existent ones with the same name.
    // *
    // * @method setServices
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @throws {Error}
    // *      Throws error if trying to change value after the module became ready
    // *
    // * @param {Object.<Object>} services
    // *      A plain object which consists of pairs key/value. The keys
    // *      are the service names and values are the service definitions.
    // *      To see more info about service definition look at
    // *      {@link Subclass.Service.Service} class constructor
    // *
    // * @example
    // *
    // * var moduleInst = Subclass.createModule("app", {
    // *      parameters: {
    // *          mode: "dev"
    // *      },
    // *      ...
    // * });
    // * ...
    // *
    // * var moduleConfigs = moduleInst.getConfigManager();
    // *
    // * // Registering services
    // * moduleConfigs.setServices({
    // *      logger: {
    // *          className: "Name/Of/LoggerService", // name of service class
    // *          arguments: [ "%mode%" ],            // arguments for service class constructor
    // *          calls: {                            // methods that will be called right away after service was created
    // *              setParams: [                    // method name
    // *                  "param 1 value",            // method argument 1
    // *                  "param 2 value"             // method argument 2
    // *              ],
    // *          }
    // *      }
    // * });
    // * ...
    // *
    // * // Creating service class
    // * moduleInst.registerClass("Name/Of/LoggerService", {
    // *      _mode: null,
    // *      _param1: null,
    // *      _param2: null,
    // *
    // *      $_constructor: function(mode)
    // *      {
    // *          this._mode = mode;
    // *      },
    // *
    // *      setParams: function(param1, param2)
    // *      {
    // *          this._param1 = param1;
    // *          this._param2 = param2;
    // *      }
    // * });
    // * ...
    // *
    // * var logger = moduleInst.getService('logger');
    // *
    // * var mode = logger._mode;     // "dev"
    // * var param1 = logger._param1; // "param 1 value"
    // * var param2 = logger._param2; // "param 2 value"
    // * ...
    // */
    //ConfigManager.prototype.setServices = function(services)
    //{
    //    this._checkModuleIsReady();
    //
    //    if (!services || !Subclass.Tools.isPlainObject(services)) {
    //        Subclass.Error.create('InvalidModuleOption')
    //            .option('services')
    //            .module(this.getModule().getName())
    //            .received(services)
    //            .expected('a plain object')
    //            .apply()
    //        ;
    //    }
    //    var serviceManager = this.getModule().getServiceManager();
    //
    //    for (var serviceName in services) {
    //        if (!services.hasOwnProperty(serviceName)) {
    //            continue;
    //        }
    //        serviceManager.registerService(
    //            serviceName,
    //            services[serviceName]
    //        );
    //    }
    //};
    //
    ///**
    // * Returns all registered services in the form as they were defined
    // *
    // * @method getServices
    // * @memberOf Subclass.ConfigManager.prototype
    // *
    // * @returns {Object.<Object>}
    // */
    //ConfigManager.prototype.getServices = function()
    //{
    //    var services = this.getModule().getServiceManager().getServices();
    //    var serviceDefinitions = {};
    //
    //    for (var i = 0; i < services.length; i++) {
    //        var serviceDefinition = services[i].getDefinition();
    //        var serviceName = services[i].getName();
    //
    //        serviceDefinitions[serviceName] = Subclass.Tools.copy(serviceDefinition);
    //    }
    //    return serviceDefinitions;
    //};

    /**
     * Sets callback function which will invoked when all classes of the module
     * will be loaded (if configuration parameter "autoload" was set in true) and registered.<br><br>
     *
     * It is the same as "onReady" parameter in module configuration. If it was defined
     * in module configuration too the new callback function will be added to the onReady
     * callbacks storage and will be invoked after other callback functions
     * which were registered earlier.<br><br>
     *
     * If "autoload" configuration parameter was set in false and there were no classes
     * registered in module at the moment and onReady callback function was not set earlier,
     * the call of current method invokes specified callback immediately.
     *
     * @method setOnReady
     * @memberOf Subclass.ConfigManager.prototype
     *
     * @throws {Error}
     *      Throws error if:<br />
     *      - trying to change value after the module became ready<br />
     *      - specified not function argument value
     *
     * @param {Function} callback
     *      Callback function which will do some initializing manipulations
     */
    ConfigManager.prototype.setOnReady = function(callback)
    {
        this._checkModuleIsReady();

        if (typeof callback != "function") {
            Subclass.Error.create('InvalidArgument')
                .argument('the callback', false)
                .received(callback)
                .expected('a function')
                .apply()
            ;
        }
        var module = this.getModule();
        var classManager = module.getClassManager();
        var eventManager = module.getEventManager();
        var onReadyEvent = eventManager.getEvent('onReady');
        var triggerable = true;

        // If onReady callback was registered earlier just add new listener

        if (onReadyEvent.hasListeners()) {
            triggerable = false;
        }

        onReadyEvent.addListener(callback);

        // Triggers onReady event if allows to trigger current event
        // and where registered any classes
        // and there are no classes that are in loading process

        if (
            triggerable
            && module.isPrepared()
            && !classManager.isEmpty()
            && !classManager.isLoading()
        ) {
            module.setReady();
        }
    };

    /**
     * Ensures that the module is not ready
     *
     * @method _checkModuleIsReady
     * @private
     * @ignore
     */
    ConfigManager.prototype._checkModuleIsReady = function()
    {
        if (this.getModule().isReady()) {
            Subclass.Error.create('Can\'t change configs in ready module.');
        }
    };

    return ConfigManager;

})();