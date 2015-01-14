/**
 * @class
 * @implements {Subclass.Class.ClassType}
 * @description Abstract class of the each class type.
 *      Each instance of current class is a class definition which will be used
 *      for creating instances of its declaration.
 */
Subclass.Class.ClassType = (function()
{
    /**
     * @param {Subclass.Class.ClassManager} classManager
     *      Instance of class manager which will hold all class definitions of current module
     *
     * @param {string} className
     *      Name of the creating class
     *
     * @param {Object} classDefinition
     *      Definition of the creating class
     *
     * @constructor
     */
    function ClassType(classManager, className, classDefinition)
    {
        if (!classManager) {
            throw new Error("The first parameter is required and must be instance of ClassManager class.");
        }
        if (!className || typeof className != 'string') {
            throw new Error("Class name must be a string!");
        }
        if (!classDefinition && typeof classDefinition != 'object') {
            throw new Error("Class definition must be an object.");
        }

        /**
         * @type {Subclass.Class.ClassManager}
         * @protected
         */
        this._classManager = classManager;

        /**
         * @type {string}
         * @protected
         */
        this._name = className;

        /**
         * @type {Subclass.Class.ClassDefinition}
         * @protected
         */
        this._definition = this.createDefinition(classDefinition);

        /**
         * @type {(function|null)}
         * @protected
         */
        this._constructor = null;

        /**
         * @type {(ClassType|null)}
         * @protected
         */
        this._parent = null;

        /**
         * @type {Object}
         * @protected
         */
        this._properties = {};

        /**
         * Initializing operations
         */
        this.initialize();
    }

    /**
     * Can be parent class type
     *
     * @type {(Subclass.Class.ClassType|null)}
     */
    ClassType.$parent = null;

    /**
     * Returns name of class type
     *
     * @example Example:
     *      Subclass.Class.Trait.Trait.getClassTypeName(); // returns "Trait"
     *
     * @returns {string}
     */
    ClassType.getClassTypeName = function ()
    {
        throw new Error('Static method "getClassTypeName" must be implemented.');
    };

    /**
     * Returns class builder constructor for specific class of current class type.
     *
     * @example Example:
     *      Subclass.Class.AbstractClass.AbstractClass.getBuilderClass();
     *      // returns Subclass.Class.AbstractClass.AbstractClassBuilder class constructor
     *
     * @returns {Function}
     */
    ClassType.getBuilderClass = function()
    {
        throw new Error('Static method "getClassBuilder" must be implemented.');
    };

    /**
     * Returns constructor for creating class definition instance
     *
     * @example Example:
     *      Subclass.Class.Class.Class.getDefinitionClass();
     *      // returns Subclass.Class.Class.ClassDefinition class constructor
     *
     * @returns {Function}
     */
    ClassType.getDefinitionClass = function()
    {
        return Subclass.Class.ClassDefinition;
    };

    /**
     * Initializes class on creation stage.
     * Current method invokes automatically right at the end of the class type constructor.
     * It can contain different manipulations with class definition or other manipulations that is needed
     */
    ClassType.prototype.initialize = function()
    {
        var classDefinition = this.getDefinition();
            classDefinition.processRelatives();
    };

    /**
     * Returns class manager instance
     *
     * @returns {Subclass.Class.ClassManager}
     */
    ClassType.prototype.getClassManager = function ()
    {
        return this._classManager;
    };

    /**
     * Returns name of the current class instance
     *
     * @returns {string}
     */
    ClassType.prototype.getName = function()
    {
        return this._name;
    };

    /**
     * Creates and returns class definition instance.
     *
     * @param {Object} classDefinition
     * @returns {Subclass.Class.ClassDefinition}
     */
    ClassType.prototype.createDefinition = function(classDefinition)
    {
        var construct = null;
        var createInstance = true;

        if (!arguments[1]) {
            construct = this.constructor.getDefinitionClass();
        } else {
            construct = arguments[1];
        }
        if (arguments[2] === false) {
            createInstance = false;
        }

        if (construct.$parent) {
            var parentConstruct = this.createDefinition(
                classDefinition,
                construct.$parent,
                false
            );

            var constructProto = Object.create(parentConstruct.prototype);

            constructProto = Subclass.Tools.extend(
                constructProto,
                construct.prototype
            );

            construct.prototype = constructProto;
            construct.prototype.constructor = construct;
        }

        if (createInstance) {
            var inst = new construct(this, classDefinition);

            if (!(inst instanceof Subclass.Class.ClassDefinition)) {
                throw new Error(
                    'Class definition class must be instance of ' +
                    '"Subclass.Class.ClassDefinition" class.'
                );
            }
            return inst;
        }

        return construct;
    };

    /**
     * Sets class definition
     *
     * @param {Object} classDefinition
     */
    ClassType.prototype.setDefinition = function(classDefinition)
    {
        this.constructor.call(
            this,
            this.getClassManager(),
            this.getName(),
            classDefinition
        );
    };

    /**
     * Returns class definition object
     *
     * @returns {Subclass.Class.ClassDefinition}
     */
    ClassType.prototype.getDefinition = function()
    {
        return this._definition;
    };

    /**
     * Sets class parent
     *
     * @param {string} parentClassName
     */
    ClassType.prototype.setParent = function (parentClassName)
    {
        if (typeof parentClassName == 'string') {
            this._parent = this.getClassManager().getClass(parentClassName)

        } else if (parentClassName === null) {
            this._parent = null;

        } else {
            throw new Error(
                'Argument parentClassName is not valid. It must be a name of parent class or null ' +
                'in class "' + this.getName() + '".'
            );
        }
    };

    /**
     * Returns parent class instance
     *
     * @return {(Subclass.Class.ClassType|null)}
     */
    ClassType.prototype.getParent = function ()
    {
        return this._parent;
    };

    /**
     * Checks whether current class extends another one
     *
     * @returns {boolean}
     */
    ClassType.prototype.hasParent = function()
    {
        return !!this._parent;
    };

    /**
     * Returns all typed properties in current class instance
     *
     * @param {boolean} withInherited
     * @returns {Object.<Subclass.Property.PropertyType>}
     */
    ClassType.prototype.getProperties = function(withInherited)
    {
        var properties = {};

        if (withInherited !== true) {
            withInherited = false;
        }

        if (withInherited && this.hasParent()) {
            var parentClass = this.getParent();
            var parentClassProperties = parentClass.getProperties(withInherited);

            Subclass.Tools.extend(
                properties,
                parentClassProperties
            );
        }
        return Subclass.Tools.extend(
            properties,
            this._properties
        );
    };

    /**
     * Adds new typed property to class
     *
     * @param {string} propertyName
     * @param {Object} propertyDefinition
     */
    ClassType.prototype.addProperty = function(propertyName, propertyDefinition)
    {
        var propertyManager = this.getClassManager().getModule().getPropertyManager();

        this._properties[propertyName] = propertyManager.createProperty(
            propertyName,
            propertyDefinition,
            this
        );
    };

    /**
     * Returns property instance by its name
     *
     * @param {string} propertyName
     * @returns {Subclass.Property.PropertyType}
     * @throws {Error}
     */
    ClassType.prototype.getProperty = function(propertyName)
    {
        var classProperties = this.getProperties();

        if (!classProperties[propertyName] && this.hasParent()) {
            return this.getParent().getProperty(propertyName);

        } else if (!classProperties[propertyName]) {
            throw new Error('Trying to call to non existent property "' + propertyName + '" ' +
                'in class "' + this.getName() + '".');
        }
        return this.getProperties()[propertyName];
    };

    /**
     * Checks if property with specified property name exists
     *
     * @param {string} propertyName
     * @returns {boolean}
     */
    ClassType.prototype.issetProperty = function(propertyName)
    {
        var classProperties = this.getProperties();

        if (!classProperties[propertyName] && this.hasParent()) {
            return !!this.getParent().getProperty(propertyName);

        } else if (!classProperties[propertyName]) {
            return false;
        }
        return true;
    };

    /**
     * Returns constructor function for current class type
     *
     * @returns {function} Returns named function
     * @throws {Error}
     */
    ClassType.prototype.getConstructorEmpty = function ()
    {
        throw new Error('Static method "getConstructor" must be implemented.');
    };

    /**
     * Returns class constructor
     *
     * @returns {Function}
     */
    ClassType.prototype.getConstructor = function ()
    {
        if (!this._constructor) {
            var classDefinition = this.getDefinition();
            var baseClassDefinition = classDefinition.getBaseData();

            classDefinition.setData(Subclass.Tools.extend(
                baseClassDefinition,
                classDefinition.getData()
            ));

            classDefinition.validateData();
            classDefinition.processData();

            this._constructor = this.createConstructor();
        }

        return this._constructor;
    };

    /**
     * Generates and returns current class instance constructor
     *
     * @returns {function}
     */
    ClassType.prototype.createConstructor = function ()
    {
        var classConstructor = this.getConstructorEmpty();
        var parentClass = this.getParent();

        if (parentClass) {
            var parentClassConstructor = parentClass.getConstructor();
            var classConstructorProto = Object.create(parentClassConstructor.prototype);

            Subclass.Tools.extend(classConstructorProto, classConstructor.prototype);
            classConstructor.prototype = classConstructorProto;
        }

        this.attachProperties(classConstructor.prototype);
        Subclass.Tools.extend(classConstructor.prototype, this.getDefinition().getMethods());
        Subclass.Tools.extend(classConstructor.prototype, this.getDefinition().getMetaData());
        Object.defineProperty(classConstructor.prototype, "constructor", {
            enumerable: false,
            value: classConstructor
        });

        classConstructor.prototype.$_className = this.getName();
        classConstructor.prototype.$_classType = this.constructor.getClassTypeName();
        classConstructor.prototype.$_class = this;

        return classConstructor;
    };

    /**
     * Creates and attaches class typed properties
     *
     * @param {Object} context Class constructor prototype
     */
    ClassType.prototype.attachProperties = function(context)
    {
        var classProperties = this.getProperties();

        for (var propName in classProperties) {
            if (!classProperties.hasOwnProperty(propName)) {
                continue;
            }
            classProperties[propName].attach(context);
        }
    };

    /**
     * Creates class instance of current class type
     *
     * @returns {object} Class instance
     */
    ClassType.prototype.createInstance = function()
    {
        var args = [];

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        var classManager = this.getClassManager();
        var classConstructor = this.getConstructor();
        var classProperties = this.getProperties(true);
        var classInstance = new classConstructor();
        var setterName;


        // Attaching hashed typed properties

        for (var propertyName in classProperties) {
            if (!classProperties.hasOwnProperty(propertyName)) {
                continue;
            }
            classProperties[propertyName].attachHashed(classInstance);

            // Getting init value

            var property = classProperties[propertyName];
            var propertyDefinition = property.getDefinition();
            var initValue = propertyDefinition.getValue();

            // Setting init value

            if (initValue !== undefined) {
                if (propertyDefinition.isAccessors()) {
                    setterName = Subclass.Tools.generateSetterName(propertyName);
                    classInstance[setterName](initValue);

                } else {
                    classInstance[propertyName] = initValue;
                }
                property.setIsModified(false);
            }
        }

        // Adding no methods to class instance

        var classNoMethods = this.getDefinition().getNoMethods(true);

        for (var propName in classNoMethods) {
            if (!classNoMethods.hasOwnProperty(propName)) {
                continue;
            }
            classInstance[propName] = Subclass.Tools.copy(classNoMethods[propName]);
        }

        Object.seal(classInstance);


        // Setting required classes to alias typed properties

        if (classInstance.$_requires) {
            if (Subclass.Tools.isPlainObject(classInstance.$_requires)) {
                for (var alias in classInstance.$_requires) {
                    if (!classInstance.$_requires.hasOwnProperty(alias)) {
                        continue;
                    }
                    setterName = Subclass.Tools.generateSetterName(alias);
                    var requiredClassName = classInstance.$_requires[alias];
                    var requiredClass = classManager.getClass(requiredClassName);

                    classInstance[setterName](requiredClass);
                }
            }
        }

        if (classInstance.$_constructor) {
            classInstance.$_constructor.apply(classInstance, args);
        }

        return classInstance;
    };

    /**
     * Checks if current class is instance of another class
     *
     * @param {string} className
     * @return {boolean}
     */
    ClassType.prototype.isInstanceOf = function (className)
    {
        if (!className) {
            throw new Error('Class name must be specified!');
        }
        if (this.getName() == className) {
            return true;
        }
        if (this.hasParent()) {
            return this.getParent().isInstanceOf(className);
        }
        return false;
    };


    /*************************************************/
    /*        Performing register operations         */
    /*************************************************/

    // Adding not allowed class properties

    Subclass.Property.PropertyManager.registerNotAllowedPropertyNames([
        "class",
        "parent",
        "classManager",
        "class_manager",
        "classWrap",
        "class_wrap",
        "className",
        "class_name"
    ]);

    return ClassType;

})();