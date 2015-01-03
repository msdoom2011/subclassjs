/**
 * @class
 * @extends {Subclass.Class.ClassDefinition}
 */
Subclass.Class.Interface.InterfaceDefinition = (function()
{
    /**
     * @inheritDoc
     */
    function InterfaceDefinition(classInst, classDefinition)
    {
        InterfaceDefinition.$parent.call(this, classInst, classDefinition);
    }

    InterfaceDefinition.$parent = Subclass.Class.ClassDefinition;

    /**
     * Validates "$_abstract" attribute value
     *
     * @param {*} value
     * @throws {Error}
     */
    InterfaceDefinition.prototype.validateAbstract = function(value)
    {
        throw new Error(
            'You can\'t specify abstract method by the property "$_abstract". ' +
            'All methods specified in interface are abstract by default.'
        );
    };

    /**
     * Validate "$_implements" attribute value
     *
     * @param {*} value
     * @throws {Error}
     */
    InterfaceDefinition.prototype.validateImplements = function(value)
    {
        throw new Error(
            'Interface "' + this.getClass().getClassName() + '" can\'t implements any interfaces. ' +
            'You can extend this one from another interface instead.'
        );
    };

    /**
     * Validate "$_static" attribute value
     *
     * @param {*} value
     * @throws {Error}
     */
    InterfaceDefinition.prototype.validateStatic = function(value)
    {
        throw new Error('You can\'t specify any static properties or methods in interface.');
    };

    /**
     * Validates "$_traits" attribute value
     *
     * @param {*} value
     * @throws {Error}
     */
    InterfaceDefinition.prototype.validateTraits = function(value)
    {
        throw new Error('Interface "' + this.getClass().getClassName() + '" can\'t contains any traits.');
    };

    /**
     * @inheritDoc
     */
    InterfaceDefinition.prototype.getBaseDefinition = function()
    {
        return {
            /**
             * @type {string} Parent class name
             */
            $_extends: null,

            /**
             * @type {Object.<Object>} Typed property definitions
             */
            $_properties: {}
        };
    };

    return InterfaceDefinition;

})();