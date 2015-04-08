app = Subclass.createModule("app", [
    'appFirstPlugin'
], {
    onConfig: function() {
        configuredModules.push('app');

        // Changing Class/AppClass class definition

        var AppClass = this.getClassManager().getClass('Class/AppClass');
        var definition = AppClass.getDefinition().getData();

        definition.configuredMethod = function() {
            return true;
        }
    }
});
