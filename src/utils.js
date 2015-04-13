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
        return name.substring(index+1).toLowerCase() === 'yaml' ||
                name.substring(index+1).toLowerCase() === 'yml' ;
    };

    /**
     * Create a function that retrieves the given attribute from an object.
     *
     * @param {String} attribute
     * @return {Function}
     */
    var getAttribute = function(element, attribute) {
        return element[attribute];
    };

    var createDictionary = function(keyFn, array) {
        return array.reduce(function(prev, curr) {
            prev[keyFn(curr)] = curr;
            return prev;
        }, {});
    };

    var addAttribute = function(attribute, object, value) {
        object[attribute] = value;
    };

    var isEmpty = function(array) {
        return !array.length;
    };

    var isGithubURL = function(string) {
        return /https:\/\/?github.com\/[\w-_]+\/[\w-_]+/.test(string);
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
            console.log('result is', result[1]);
            return result[1];
        }
        console.log('result is', name);
        return name;
    };

    global.Utils = {
        capitalize: capitalize,
        isYamlFile: isYamlFile,
        isGithubURL: isGithubURL,
        removeFileExtension: removeFileExtension,
        getAttribute: getAttribute,
        addAttribute: addAttribute,
        isEmpty: isEmpty,
        createDictionary: createDictionary
    };

})(this);
