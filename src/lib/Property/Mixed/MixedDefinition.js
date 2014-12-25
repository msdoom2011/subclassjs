/**
 * @class
 * @extends {Subclass.PropertyManager.PropertyTypes.PropertyDefinition}
 */
Subclass.PropertyManager.PropertyTypes.MixedDefinition = (function()
{
    /**
     * @param {PropertyType} property
     * @param {Object} propertyDefinition
     * @constructor
     */
    function MixedDefinition (property, propertyDefinition)
    {
        MixedDefinition.$parent.call(this, property, propertyDefinition);
    }

    MixedDefinition.$parent = Subclass.PropertyManager.PropertyTypes.PropertyDefinition;

    /**
     * @inheritDoc
     */
    MixedDefinition.prototype.getEmptyValue = function()
    {
        return this.isNullable() ? null : false;
    };

    /**
     * Validates "allows" attribute value
     *
     * @param {*} allows
     */
    MixedDefinition.prototype.validateAllows = function(allows)
    {
        if (!allows) {
            throw new Error('Missed "allows" parameter in definition ' +
                'of mixed type property ' + this.getProperty() + ".");
        }
        if (!Array.isArray(allows) && !allows.length) {
            throw new Error('Specified not valid "allows" parameter in definition ' +
                'of property ' + this.getProperty() + '. ' +
                'It must be a not empty array with definitions of needed property types.');
        }
        for (var i = 0; i < allows.length; i++) {
            if (!Subclass.Tools.isPlainObject(allows[i])) {
                throw new Error('Specified not valid values in "allows" parameter in definition ' +
                    'of property ' + this.getProperty() + '. ' +
                    'It must property definitions.');
            }
        }
    };

    /**
     * Sets "allows" attribute of property definition
     *
     * @param {Array} allows
     */
    MixedDefinition.prototype.setAllows = function(allows)
    {
        this.validateAllows(allows);
        this.getDefinition().allows = allows;
    };

    /**
     * Returns value of "allows" attribute of property definition
     *
     * @returns {Array}
     */
    MixedDefinition.prototype.getAllows = function()
    {
        return this.getDefinition().allows;
    };

    /**
     * Returns all allowed value types according to allows parameter of property definition.
     *
     * @returns {string[]}
     */
    MixedDefinition.prototype.getAllowsNames = function()
    {
        var allows = this.getAllows();
        var typeNames = [];

        for (var i = 0; i < allows.length; i++) {
            typeNames.push(allows[i].type);
        }
        return typeNames;
    };

    /**
     * @inheritDoc
     */
    MixedDefinition.prototype.getRequiredAttributes = function()
    {
        var attrs = MixedDefinition.$parent.prototype.getRequiredAttributes.call(this);

        return attrs.concat(['allows']);
    };

    /**
     * @inheritDoc
     */
    MixedDefinition.prototype.getBaseDefinition = function()
    {
        var basePropertyDefinition = MixedDefinition.$parent.prototype.getBaseDefinition.call(this);

        /**
         * Allows to specify allowed types of property value.
         * Every value in array must be property definition of needed type
         *
         * @type {Object[]}
         */
        basePropertyDefinition.allows = [];

        return basePropertyDefinition;
    };

    /**
     * @inheritDoc
     */
    MixedDefinition.prototype.processDefinition = function()
    {
        var allows = this.getAllows();

        if (allows && Array.isArray(allows)) {
            for (var i = 0; i < allows.length; i++) {
                if (!Subclass.Tools.isPlainObject(allows[i])) {
                    continue;
                }
                this.getProperty().addAllowedType(allows[i]);
            }
        }
        MixedDefinition.$parent.prototype.processDefinition.call(this);
    };

    ///**
    // * @inheritDoc
    // */
    //MixedDefinition.prototype.validateDefinition = function()
    //{
    //    var allows = this.getAllows();
    //
    //    if (!allows) {
    //        throw new Error('Missed "allows" parameter in definition ' +
    //            'of mixed type property "' + this.getPropertyNameFull() + '"' +
    //            (this.getContextClass() ? (' in class "' + this.getContextClass().getClassName() + '"') : "") + ".");
    //    }
    //    if (!Array.isArray(allows) || !allows.length) {
    //        throw new Error('Specified not valid "allows" parameter in definition ' +
    //            'of property "' + this.getPropertyNameFull() + '" ' +
    //            (this.getContextClass() ? (' in class "' + this.getContextClass().getClassName() + '"') : "") + ". " +
    //            'It must be a not empty array with definitions of needed property types.');
    //    }
    //    for (var i = 0; i < allows.length; i++) {
    //        if (!Subclass.Tools.isPlainObject(allows[i])) {
    //            throw new Error('Specified not valid values in "allows" parameter in definition ' +
    //                'of property "' + this.getPropertyNameFull() + '" ' +
    //                (this.getContextClass() ? (' in class "' + this.getContextClass().getClassName() + '"') : "") + ". " +
    //                'It must property definitions.');
    //        }
    //    }
    //
    //    MixedDefinition.$parent.prototype.validateDefinition.call(this);
    //};

    return MixedDefinition;

})();
