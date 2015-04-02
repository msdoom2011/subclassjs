var appForthPlugin = Subclass.createModule('appForthPlugin', {
    pluginOf: 'appSecondPlugin'
});

!function() {

    var plug = appForthPlugin;

    plug.registerClass("Plugs/ClassBase", {

        $_extends: "Plugs/AbstractClass",

        $_implements: ["Plugs/Interface"],

        $_traits: ["Plugs/Trait"],

        walk: function()
        {
            return true;
        }
    });

    plug.registerClass("Plugs/Class", {

        $_extends: "Plugs/ClassBase",

        dance: function()
        {
            return true;
        }
    });
}();