/*globals CodeMirror*/
/*
 * The CodeEditor allows for editing the yaml directly and then generating the 
 * needed info to represent the given changes in the block editor.
 */

(function(global) {
    'use strict';

    var CodeEditor = function(container) {
        var opts = {lineNumbers: true};
        this.editor = CodeMirror.fromTextArea(container, opts);
        console.log('Created the CodeEditor!');
    };

    global.CodeEditor = CodeEditor;
})(this);
