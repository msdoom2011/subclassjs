/**
 * @class
 * @extends {Subclass.PropertyManager.PropertyTypes.CollectionDefinition}
 */
Subclass.PropertyManager.PropertyTypes.ArrayCollectionDefinition = (function()
{
    /**
     * @param {PropertyType} property
     * @param {Object} propertyDefinition
     * @constructor
     */
    function ArrayCollectionDefinition (property, propertyDefinition)
    {
        ArrayCollectionDefinition.$parent.call(this, property, propertyDefinition);
    }

    ArrayCollectionDefinition.$parent = Subclass.PropertyManager.PropertyTypes.CollectionDefinition;

    /**
     * @inheritDoc
     * @retruns {(string|null)}
     */
    ArrayCollectionDefinition.prototype.validateValue = function(value)
    {
        if (ArrayCollectionDefinition.$parent.prototype.validateValue.call(this, value)) {
            return;
        }
        if (!value || typeof value != 'object' || !Array.isArray(value)) {
            var message = 'The value of the property ' + this.getProperty() + ' must be an array or null. ';

            if (typeof value == 'object' && value.$_className) {
                message += 'Instance of class "' + value.$_className + '" was received instead.';

            } else if (typeof value == 'object') {
                message += 'Object with type "' + value.constructor.name + '" was received instead.';

            } else {
                message += 'Value with type "' + (typeof value) + '" was received instead.';
            }
            throw new Error(message);
        }
    };

    /**
     * @inheritDoc
     */
    ArrayCollectionDefinition.prototype.processDefinition = function()
    {
        ArrayCollectionDefinition.$parent.prototype.processDefinition.call(this);

        var defaultValue = this.getValue();

        if (defaultValue !== null) {
            var collection = this.getProperty().getCollection();
            var proto = this.getProto();

            this.getProperty().setIsNull(false);

            for (var propName in defaultValue) {
                if (!defaultValue.hasOwnProperty(propName)) {
                    continue;
                }
                if (!this.isWritable()) {
                    proto.writable = false;
                }
                collection.addItem(defaultValue[propName]);
            }
        }
    };

    return ArrayCollectionDefinition;

})();
