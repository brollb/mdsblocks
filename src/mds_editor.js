/*globals prompt,yaml,confirm,R,Utils,CodeEditor,alert,GithubLoader,OAUTH_TOKEN,MDSBlockCreator,Blockly*/
/*
 * MDS Editor contains the block container and Github loader container.
 *
 * Basically, MDS Editor facilitates communication between the loader and the 
 * block creator.
 */
(function(global) {
    'use strict';
    
    //var DEFAULT_PROJECT = 'https://github.com/brollb/concept-creation';
    var DEFAULT_PROJECT = 'https://github.com/brollb/metamds-p1/tree/a491228f470cbc38a4766985722a920a2688b91d';

    var MDSEditor = function(opts) {
        this.toolbox = document.getElementById('toolbox');
        this.tagContainer = document.getElementById('tag-container');
        this.workspaceContainer = document.getElementById('workspace-container');

        this.toolboxContainer = document.getElementById('toolbox-container');
        // Container for toolbox and text editor
        this.workingContainer = document.getElementById('working-container');

        this.openProjectBtn = opts.openProjectBtn;
        this.openProjectBtn.onclick = this.onChangeProjectClicked.bind(this);

        // Initialize the interfaces
        // Currently, I am using OAUTH_TOKEN = <my_github_token>. Obviously, to log in as
        // someone else, we can just change OAUTH_TOKEN
        this.github = new GithubLoader({token: OAUTH_TOKEN});
        this.blockEditor = new MDSBlockCreator(this.toolbox, 
                                this.workspaceContainer, this.tagContainer);
        //this.blockEditor.onWorkspaceChanged = this.updateCodeEditor.bind(this);

        var codeContainer = document.getElementById('editor-container');
        this.codeEditor = new CodeEditor(codeContainer);
        this.codeEditor.onExit = this.updateBlockEditor.bind(this);
        this.toggleCodeEditor();

        this.loadProject(DEFAULT_PROJECT);
    };

    MDSEditor.prototype.onChangeProjectClicked = function() {
        var project = prompt('Enter the github project url to open');
        if (project) {
            this.loadProject(project);
        }
    };

    MDSEditor.prototype.loadProject = function(project) {
        this.currentProject = project;
        this.github.loadProject(project, function(err) {
            if (err) {
                console.error(err);
            }

            // Create blocks for each concept
            var concepts = this.github.getConcepts();
            console.log('Concepts are:', concepts);
            this.blockEditor.createProject(this.github.projectConcepts, concepts, function() {
                Blockly.mainWorkspace.fireChangeEvent = this.updateCodeEditor.bind(this);
            }.bind(this));

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
        var data = this.blockEditor.getSaveData();
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
        
        this._download(Blockly.Python.workspaceToCode(), this.blockEditor.currentWorkspace+'.yaml');
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

    /**
     * Update the text in the code editor on block change.
     *
     * @return {undefined}
     */
    MDSEditor.prototype.updateCodeEditor = function() {
        // Check that the blocks are all instantiated
        var topBlocks = Blockly.getMainWorkspace().topBlocks_;
        if (R.all(R.partialRight(Utils.hasAttribute, 'type'))(topBlocks)) {
            this.codeEditor.editor.setValue(Blockly.Python.workspaceToCode());
        }
    };

    /**
     * Update the block editor given text changes.
     *
     * @return {undefined}
     */
    MDSEditor.prototype.updateBlockEditor = function() {
        // Get the text
        var text = this.codeEditor.editor.getValue(),
            failed = false,
            json;

        // Validate the text
        if (text.length > 0) {
            //try {
                text = text.replace('\t', '    ');  // replace tabs w/ 4 spaces
                json = yaml.load(text);
                failed = !this.blockEditor.updateProject(json);
            //} catch (e) {
                //failed = true;
            //}

            // If the block editor couldn't be loaded update the code editor
            if (failed) {
                var reload = confirm('Invalid YAML syntax.'+
                '\nWould you like to discard your text edits?');
            if (reload) {
                this.updateCodeEditor();
            }
            }
        }

    };

    global.MDSEditor = MDSEditor;
})(this);
