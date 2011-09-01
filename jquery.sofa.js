(function ($) {

    // Requires JSON

    var _ls = window.localStorage;

    var methods = {

        // Private methods
        _is_initialised: function () {
            return _ls.getItem("_sofa_initialised");
        },
        _init: function () {
            if (!methods._is_initialised()) {
                _ls.setItem("_sofa_initialised", true);
                _ls.setItem("_known_types", $.toJSON([]));
            }
        },


        // Helper functions for checking the types that sofa knows about
        // and for creating types on the fly.
        _knows_about: function (type) {
            var types = $.parseJSON(_ls.getItem("_known_types"));
            return ($.inArray(type, types) > -1);
        },
        _create_type: function (type) {
            var types = $.parseJSON(_ls.getItem("_known_types"));
            types.push(type);
            _ls.setItem("_known_types", $.toJSON(types));
            _ls.setItem("_" + type + "_index", -1);
            _ls.setItem("_" + type + "_count", 0);
        },


        // Helper functions for parsing the locator which is a string of the form
        // /type/{index}. Only single level locators are currently supported.
        _get_type: function (locator) {
            return locator.split("/")[1];
        },
        _get_index: function (locator) {
            return locator.split("/")[2];
        },

        // Helper functions for accessing the index (ie the sofa generated
        // "key") of the particular type. Indices are never decremented.
        _get_type_index: function (type) {
            return parseInt(_ls.getItem("_" + type + "_index"));
        },
        _increment_type_index: function (type) {
            var type_index = parseInt(_ls.getItem("_" + type + "_index"));
            _ls.setItem("_" + type + "_index", (type_index + 1));
        },


        // Helper functions for accessing the count of a particular type.
        // The count is the total number of documents that are currently
        // stored of that type.
        _increment_type_count: function (type) {
            var type_count = parseInt(_ls.getItem("_" + type + "_count"));
            _ls.setItem("_" + type + "_count", (type_count + 1));
        },
        _decrement_type_count: function (type) {
            var type_count = parseInt(_ls.getItem("_" + type + "_count"));
            _ls.setItem("_" + type + "_count", (type_count - 1));
        },


        // Debug/information functions
        _sofa_size: function () {
            var total_size = 0;
            var types = $.parseJSON(_ls.getItem("_known_types"));
            $(types).each(function (_i, type) {
                var items = methods.get("/" + type);
                var type_size = 0;
                $(items).each(function (i, item) {
                    type_size += $.toJSON(item).length;
                });
                total_size += type_size;
            });
            return total_size;
        },

        // Public methods

        // Get a count of the documents in the type "locator" (eg /items)
        count: function (locator) {
            var type = methods._get_type(locator);
            if (methods._knows_about(type)) {
                return parseInt(_ls.getItem("_" + type + "_count"));
            }
            return 0;
        },
        // Get documents matching locator.
        // Note: currently, the only supported types of locator are:
        // /items (all documents of type "items")
        // /items/1 (document of type "items" at index 1)
        get: function (locator) {
            var type = methods._get_type(locator);
            if (methods._knows_about(type)) {
                // Get a single item
                if (locator.split("/").length > 2) {
                    var index = methods._get_index(locator);
                    var item = _ls.getItem(type + "_" + index);
                    if (item && item != null)
                        return $.parseJSON(_ls.getItem(type + "_" + index));
                    return null;
                }
                // Get a list of items
                else if (locator.split("/").length == 2) {
                    var items = [];
                    for (var i = 0; i <= methods._get_type_index(type); i++) {
                        var item = methods.get("/" + type + "/" + i);
                        if (item != null)
                            items.push(item);
                    }
                    return items;
                }
                return null;
            }
        },
        // Set the matching locator to the given value (eg "/items/1")
        set: function (locator, value) {
            var type = methods._get_type(locator);
            if (methods._knows_about(type)) {
                var index = methods._get_index(locator);
                _ls.setItem(type + "_" + index, $.toJSON(value));
            }
        },
        // Create a new value matching the locator (eg "/items)
        // This method returns the index of the newly created item.
        create: function (locator, value) {
            var type = methods._get_type(locator);
            if (!methods._knows_about(type)) {
                methods._create_type(type);
            }
            var index = methods._get_type_index(type) + 1;
            _ls.setItem(type + "_" + index, $.toJSON(value));
            methods._increment_type_count(type);
            methods._increment_type_index(type);
            return index;
        },
        // Remove the item specified by the locator (eg "/items/1")
        // Note: "/items" is not currently supported for removal.
        remove: function (locator) {
            var type = methods._get_type(locator);
            if (methods._knows_about(type)) {
                var index = methods._get_index(locator);
                _ls.removeItem(type + "_" + index);
                methods._decrement_type_count(type);
            }
        }
    };

    $.extend({
        sofa: function (method) {
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.sofa');
            }
        }
    });

})(jQuery);