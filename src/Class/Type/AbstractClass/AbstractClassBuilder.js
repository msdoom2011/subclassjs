/**
 * @class
 * @extends {Subclass.Class.ClassBuilder}
 */
Subclass.Class.AbstractClass.AbstractClassBuilder = (function()
{
    function AbstractClassBuilder(classManager, classType, className)
    {
        AbstractClassBuilder.$parent.call(this, classManager, classType, className);
    }

    AbstractClassBuilder.$parent = Subclass.Class.Class.ClassBuilder;

    /**
     * Validates abstract methods argument
     *
     * @param {Object.<Function>} abstractMethods
     * @private
     */
    AbstractClassBuilder.prototype._validateAbstractMethods = function(abstractMethods)
    {
        if (!Subclass.Tools.isPlainObject(abstractMethods)) {
            Subclass.Error.create('InvalidArgument')
                .argument("list of abstract methods", false)
                .received(abstractMethods)
                .expected("a plain object with functions")
                .apply()
            ;
        }
        for (var methodName in abstractMethods) {
            if (abstractMethods.hasOwnProperty(methodName)) {
                this._validateAbstractMethod(abstractMethods[methodName]);
            }
        }
    };

    /**
     * Validates abstract method
     *
     * @param abstractMethod
     * @private
     */
    AbstractClassBuilder.prototype._validateAbstractMethod = function(abstractMethod)
    {
        if (typeof abstractMethod != 'function') {
            Subclass.Error.create('InvalidArgument')
                .argument('abstract method', false)
                .received(abstractMethod)
                .expected('a function')
                .apply()
            ;
        }
    };

    /**
     * Sets abstract methods
     *
     * @param {Object.<Function>} abstractMethods
     * @returns {Subclass.Class.AbstractClass.AbstractClassBuilder}
     */
    AbstractClassBuilder.prototype.setAbstractMethods = function(abstractMethods)
    {
        this._validateAbstractMethods(abstractMethods);
        this._getDefinition().$_abstract = abstractMethods;

        return this;
    };

    /**
     * Adds new abstract methods
     *
     * @param {Object.<Function>} abstractMethods
     * @returns {Subclass.Class.AbstractClass.AbstractClassBuilder}
     */
    AbstractClassBuilder.prototype.addAbstractMethods = function(abstractMethods)
    {
        this._validateAbstractMethods(abstractMethods);

        if (!this._getDefinition().$_abstract) {
            this._getDefinition().$_abstract = {};
        }
        Subclass.Tools.extend(
            this._getDefinition().$_abstract,
            abstractMethods
        );

        return this;
    };

    /**
     * Adds new abstract method
     *
     * @param {string} methodName
     * @param {Function} methodFunction
     * @returns {Subclass.Class.Config.ConfigBuilder}
     */
    AbstractClassBuilder.prototype.addAbstractMethod = function(methodName, methodFunction)
    {
        this._validateAbstractMethod(methodFunction);

        if (!methodName || typeof methodName != 'string') {
            Subclass.Error.create('InvalidArgument')
                .argument('name of abstract method', false)
                .received(methodName)
                .expected('a string')
                .apply()
            ;
        }
        if (!this._getDefinition().$_abstract) {
            this._getDefinition().$_abstract = {};
        }
        this._getDefinition().$_abstract[methodName] = methodFunction;

        return this;
    };


    /**
     * Returns abstract methods
     *
     * @returns {Object.<Function>}
     */
    AbstractClassBuilder.prototype.getAbstractMethods = function()
    {
        return this._getDefinition().$_abstract || {};
    };

    /**
     * Removes abstract method with specified method name
     *
     * @param {string} abstractMethodName
     * @returns {Subclass.Class.AbstractClass.AbstractClassBuilder}
     */
    AbstractClassBuilder.prototype.removeAbstractMethod = function(abstractMethodName)
    {
        var abstractMethods = this.getAbstractMethods();

        delete abstractMethods[abstractMethodName];

        return this;
    };

    return AbstractClassBuilder;

})();