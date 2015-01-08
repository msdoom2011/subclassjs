/**
 * @class
 */
Subclass.Service.ServiceFactory = (function()
{
    /**
     * @param {Subclass.Service.ServiceManager} serviceManager
     * @constructor
     */
    function ServiceFactory(serviceManager)
    {
        /**
         * Service manager instance
         *
         * @type {Subclass.Service.ServiceManager}
         */
        this._serviceManager = serviceManager;
    }

    /**
     * Returns service manager instance
     *
     * @returns {Subclass.Service.ServiceManager}
     */
    ServiceFactory.prototype.getServiceManager = function()
    {
        return this._serviceManager;
    };

    /**
     * Returns service class instance
     *
     * @param {Subclass.Service.Service} serviceDefinition
     * @param {boolean} [newInstance = false]
     * @returns {Object}
     */
    ServiceFactory.prototype.getService = function(serviceDefinition, newInstance)
    {
        var firstCreation = false;

        if (newInstance !== true) {
            newInstance = false;
        }
        if (serviceDefinition.getAbstract()) {
            serviceDefinition._throwAbstractService();
        }
        if (
            serviceDefinition.isInitialized()
            && serviceDefinition.isSingleton()
            && !newInstance
        ) {
            return serviceDefinition.getInstance();
        }
        if (!serviceDefinition.isInitialized()) {
            serviceDefinition.initialize();
            firstCreation = true;
        }
        var serviceClassInst = this.createService(serviceDefinition, newInstance);

        if (firstCreation) {
            serviceDefinition.setInstance(serviceClassInst);
        }

        return serviceClassInst;
    };

    /**
     * Creates and returns service class instance
     *
     * @param {Subclass.Service.Service} serviceDefinition
     * @param {boolean} [newInstance]
     */
    ServiceFactory.prototype.createService = function(serviceDefinition, newInstance)
    {
        if (serviceDefinition.getAbstract()) {
            serviceDefinition._throwAbstractService();
        }
        var serviceManager = this.getServiceManager();
        var classManager = serviceManager.getModule().getClassManager();

        // Creating class instance

        var classDef = classManager.getClass(serviceDefinition.getClassName());
        var classArguments = serviceDefinition.normalizeArguments(serviceDefinition.getArguments());
        var classInst = classDef.createInstance.apply(classDef, classArguments);

        // Processing calls

        var calls = serviceDefinition.normalizeCalls(serviceDefinition.getCalls());

        for (var methodName in calls) {
            if (!calls.hasOwnProperty(methodName)) {
                continue;
            }
            classInst[methodName].apply(
                classInst,
                calls[methodName]
            );
        }

        // Processing tags

        if (classInst.isImplements('Subclass/Service/TaggableInterface')) {
            var taggedServices = serviceManager.getServicesByTag(
                serviceDefinition.getName(),
                newInstance
            );

            classInst.processTaggedServices(taggedServices);
        }

        return classInst;
    };

    return ServiceFactory;

})();