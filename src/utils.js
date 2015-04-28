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

    var contains = function(array, value) {
        return array.indexOf(value) > -1;
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
            return result[1];
        }
        return name;
    };

    /**
     * Get the indent level in terms of number of spaces.
     *
     * @param {String} y
     * @return {Number}
     */
    var getIndentLevel = function(y) {
        return /^\s*/.exec(y)[0].length;
    };

    /**
     * Convert concatenated yaml concepts to a yaml array (list).
     *
     * @param {String} y
     * @return {String}
     */
    var yamlListToArray = function(y) {
        // Assume that the first white space is the default indent
        var baseLevel = getIndentLevel(y),
            lines = y.split('\n'),
            r = /^\s*/,
            indent = new Array(baseLevel+1).join(' '),
            ws;

        for (var i = 0; i < lines.length-1; i++) {
            if (getIndentLevel(lines[i]) === baseLevel) {  // doesn't start with indent
                ws = r.exec(lines[i]);
                lines[i] = indent + '- '+lines[i].substring(baseLevel);
            } else {
                lines[i] = '  '+lines[i];
            }
        }
        return lines.join('\n');
    };

    global.Utils = {
        capitalize: capitalize,
        isYamlFile: isYamlFile,
        isGithubURL: isGithubURL,
        removeFileExtension: removeFileExtension,
        getAttribute: getAttribute,
        addAttribute: addAttribute,
        isEmpty: isEmpty,
        contains: contains,
        createDictionary: createDictionary,
        yamlListToArray: yamlListToArray 
    };

})(this);
