/**
 * @param {string} optName
 * @param {*} optValue
 * @param {Subclass.Property.PropertyType} property
 * @param {string} neededType
 */
Subclass.Property.Error.InvalidOption = function(optName, optValue, property, neededType)
{
    var message = 'Invalid value of option "' + optName + '" ';
    message += 'in definition of property ' + property + '. ';
    message += 'It must be ' + neededType + '. ';
    message += Subclass.Exception.generateValueType(optValue);

    throw new Error(message);
};