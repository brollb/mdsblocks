/*globals CodeMirror*/
/*
 * The CodeEditor allows for editing the yaml directly and then generating the 
 * needed info to represent the given changes in the block editor.
 */

(function(global) {
    'use strict';

    var CodeEditor = function(container) {
        var opts = {lineNumbers: true,
                    mode: 'text/x-yaml',
                    keyMap: 'vim',  // Probably should turn this off later...
                    matchBrackets: true,
                    showCursorWhenSelecting: true
                    };
        this.container = container;

        var rect = container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height

        this.editor = CodeMirror.fromTextArea(container, opts);

        this.visible = true;
    };

    CodeEditor.prototype.show = function(text) {
        text = text || '';
        this.visible = true;
        // Make the panel visible
        this._updateSize();
        this.editor.setSize(this.width, this.height);
        this.editor.setValue(text);
    };

    CodeEditor.prototype.hide = function() {
        // Set the width to zero
        this.container.style.width = 0+'px';
        this.editor.setSize(0, 0);
        this.visible = false;
    };

    CodeEditor.prototype.setWidth = function(width) {
        this.width = width;
        if (this.visible) {
            this._updateSize();
        }
    };

    CodeEditor.prototype._updateSize = function() {
        this.container.style.width = this.width+'px';
    };

    global.CodeEditor = CodeEditor;
})(this);
