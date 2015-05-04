/*globals CodeEditor,alert,GithubLoader,OAUTH_TOKEN,MDSBlockCreator,Blockly*/
/*
 * MDS Editor contains the block container and Github loader container.
 *
 * Basically, MDS Editor facilitates communication between the loader and the 
 * block creator.
 */
(function(global) {
    'use strict';
    
    var DEFAULT_PROJECT = 'https://github.com/brollb/metamds-p1';

    var MDSEditor = function(opts) {
        this.toolbox = document.getElementById('toolbox');
        this.tagContainer = document.getElementById('tag-container');
        this.workspaceContainer = document.getElementById('workspace-container');

        this.toolboxContainer = document.getElementById('toolbox-container');
        // Container for toolbox and text editor
        this.workingContainer = document.getElementById('working-container');

        // Initialize the interfaces
        this.github = new GithubLoader({token: OAUTH_TOKEN});
        this.blockCreator = new MDSBlockCreator(this.toolbox, 
                                this.workspaceContainer, this.tagContainer);

        var codeContainer = document.getElementById('editor-container');
        this.codeEditor = new CodeEditor(codeContainer);
        this.toggleCodeEditor();
        this.loadProject(DEFAULT_PROJECT);
    };

    MDSEditor.prototype.loadProject = function(project) {
        this.currentProject = project;
        this.github.loadProject(project, function(err) {
            if (err) {
                console.error(err);
            }

            // Create blocks for each concept
            var concepts = this.github.getConcepts();
            this.blockCreator.createProject(this.github.projectConcepts, concepts);

            Blockly.inject(document.getElementById('toolbox-container'),
                {toolbox: this.toolbox});

            window.parent.blocklyLoaded(Blockly);
        }.bind(this));
    };

    /**
     * Save the current project to Github.
     *
     * @return {undefined}
     */
    MDSEditor.prototype.saveProject = function() {
        var data = this.blockCreator.getSaveData();
        try {
            this.github.saveProject(data);
        } catch(e) {
            // FIXME: Errors are not escalated from octokat...
            alert('Unable to save project. Please download the code and manually commit to Github. \n\nFor more info, please open the console.');
            console.error('Error:', e);
        }
    };

    MDSEditor.prototype.downloadActiveWorkspace = function() {
        // Get the name of the current project
        
        this._download(Blockly.Python.workspaceToCode(), this.blockCreator.currentWorkspace+'.yaml');
    };

    MDSEditor.prototype._download = function(data, filename) {
        if (!data || !filename) {
            console.error('MDSEditor download error: File:', filename,', Data:', data);
            return;
        }

        if (typeof data === 'object') {
            data = JSON.stringify(data, undefined, 4);
        }

        var blob = new Blob([data], {type: 'text/json'}),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    };

    MDSEditor.prototype.toggleCodeEditor = function() {
        var availableWidth = this.workingContainer.getBoundingClientRect().width,
            width = availableWidth - this.toolboxContainer.getBoundingClientRect().left;

        if (this.codeEditor.visible) {  // hide the editor
            this.codeEditor.hide();

            // Resize the blocks workspace
            this.toolboxContainer.style.width = width+'px';
        } else {  // show the editor
            this.codeEditor.show(Blockly.Python.workspaceToCode());

            // Resize the blocks workspace
            width -= this.codeEditor.width;
            this.toolboxContainer.style.width = width+'px';
        }
    };

    global.MDSEditor = MDSEditor;
})(this);
