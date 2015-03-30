// Utils for metaMDS and blockly
(function(global) {
    'use strict';
    var filenameRegex = /(.*)\.[a-zA-Z0-9]+/;

    /**
     * Capitalize the first character in the string
     *
     * @param {String} string
     * @return {String}
     */
    var capitalize = function(string) {
        return string.charAt(0).toUpperCase() + string.substring(1);
    };

    /**
     * Check if 'name' has a yaml file extension.
     *
     * @param {String} name
     * @return {Boolean} 
     */
    var isYamlFile = function(name) {
        if (!name) {
            return false;
        }
        var index = name.lastIndexOf('.');
        return name.substring(index+1).toLowerCase() === 'yaml';
    };

    /**
     * Create a function that retrieves the given attribute from an object.
     *
     * @param {String} attribute
     * @return {Function}
     */
    var getAttribute = function(attribute) {
        return function(element) {
            return element[attribute];
        };
    };

    /**
     * Remove a file extension.
     *
     * @param {String} name
     * @return {undefined}
     */
    var removeFileExtension = function(name) {
        var result = filenameRegex.exec(name);
        if (result) {
            return result[1];
        }
        return name;
    };

    global.Utils = {
        capitalize: capitalize,
        isYamlFile: isYamlFile,
        removeFileExtension: removeFileExtension,
        getAttribute: getAttribute
    };

})(this);
