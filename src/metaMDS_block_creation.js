/*globals prompt,R,Utils,Blockly,yaml*/
/*
 * The MDSBlockCreator takes a concept JSON file and creates a blockly code block from it.
 */
(function(global) {
    'use strict';

    var count = 0,
        PRIMITIVES = [
            /* [ REGEX_PATTERN, BLOCK_NAME, BLOCK_FIELD_NAME ]*/
            [ /\.*/, 'text', 'TEXT' ],
            [ /\d*\.\d+/, 'math_number', 'NUM' ],  // Float
            [ /\d+/, 'math_number', 'NUM' ]  // Integer
        ],
        ALL_BLOCKS = 'All',
        SELECTED_CLASS = {TAG: 'btn btn-info', WORKSPACE: 'btn btn-info'},
        DEFAULT_CLASS = {TAG: 'btn btn-default', WORKSPACE: 'btn btn-default'};

    /**
     * MDSBlockCreator
     *
     * @constructor
     * @param {DOM Element} toolbox
     * @return {undefined}
     */
    var MDSBlockCreator = function(toolbox, workspaces, tags) {
        this.toolbox = toolbox;
        this.workspaceContainer = workspaces;
        this.tagContainer = tags;

        this.initialize();
    };

    MDSBlockCreator.prototype.initialize = function() {
        this._concepts = {};

        this.workspaces = {};  // name -> {yaml, instance}
        this.currentWorkspace = null;
        this.workspaceBtns = {};

        this.tags = {};
        this.activeTags = [];
        this.tagButtons = {};
    };

    /**
     * Create JSON from YAML and add concept name to the concept JSON.
     *
     * @param {Dictionary} yamlConcepts
     * @return {Dictionary} concepts
     */
    MDSBlockCreator.prototype.cleanConceptInput = function(yamlConcepts) {
        // Create JSON from yamlConcepts
        var concepts = R.mapObj(yaml.load, yamlConcepts);

        // Add 'name' to the concept
        var addNameToConcept = R.partial(Utils.addAttribute, 'name');
        R.mapObjIndexed(addNameToConcept, concepts);

        // clean the names
        var names = Object.keys(concepts),
            name,
            result = {};

        for (var i = names.length;i--;) {
            name = this._cleanName(names[i]);
            concepts[names[i]].name = name;
            result[name] = concepts[names[i]];
        }

        return result;
    };

    /**
     * Topological sort of the concepts.
     *
     * @param {Array<Concept>}concepts
     * @return {undefined}
     */
    MDSBlockCreator.prototype._sortConcepts = function(concepts) {
        var nodes = this._createGraph(R.clone(concepts)),
            dict = Utils.createDictionary(R.partialRight(Utils.getAttribute, 'name'), concepts),
            isInDict = R.partialRight(R.has, dict),
            removeNonDictTypes = R.partial(R.filter, isInDict);

        // Remove external dependencies 
        nodes = R.map(removeNonDictTypes, nodes);

        // Convert nodes to a name -> node dictionary
        var getNameFromConceptArray = function(node) {
            var index = nodes.indexOf(node);
            return concepts[index].name;
        };
        var nodeDict = Utils.createDictionary(getNameFromConceptArray, nodes);
        
        // Sort the remaining nodes
        var independents, 
            orderedNodes = [],
            node;

        while (Object.keys(nodeDict).length) {
            independents = Object.keys(R.pickBy(Utils.isEmpty, nodeDict));
            if (!independents.length) {  // Cycle detected
                console.error('There is no topological sort for the given blocks!');
                break;
            }
            // Pick one and remove edges
            while (independents.length) {
                node = independents.pop();
                orderedNodes.push(node);
                nodeDict = this._removeNode(node, nodeDict);
            }
        }

        return orderedNodes;
    };

    /**
     * Remove all instances of "node" in the values (arrays) in nodeDict.
     *
     * @param {String} node
     * @param {Dictionary} nodeDict
     * @return {Dictionary} nodeDict
     */
    MDSBlockCreator.prototype._removeNode = function(node, nodeDict) {
        var isNode = R.partial(R.eq, node),
            removeNodeFromDeps = R.partial(R.reject, isNode);

        nodeDict = R.mapObj(removeNodeFromDeps, nodeDict);
        delete nodeDict[node];
        return nodeDict;
    };

    /**
     * Return a list of nodes where a node has edges to it's dependencies.
     *
     * @param {Array<Concept>} concepts
     * @return {Array<ConceptNodes>}
     */
    MDSBlockCreator.prototype._createGraph = function(concepts) {
        // For each concept, create a node with edges to it's dependencies
        // Ignore dependencies that are non-concepts (atomic)
        var names = R.map(R.partialRight(Utils.getAttribute,'name'), concepts),
            properties = R.map(R.partialRight(Utils.getAttribute,'properties'), concepts),
            getTypes = R.partial(R.mapObj, R.partialRight(Utils.getAttribute,'type'));

        // For each property, get the type
        properties = R.map(getTypes, properties);
        return R.map(R.values, properties);
    };

    MDSBlockCreator.prototype._addToConceptRecord = function(concept) {
        this._concepts[concept.name] = concept;
    };

    /**
     * Load all provided concepts and create the respective blocks.
     *
     * @param {Dictionary<Concept>} yamlConcepts
     * @return {undefined}
     */
    MDSBlockCreator.prototype.createBlocks = function(yamlConcepts) {
        // Create JSON from yamlConcepts
        var conceptMap = this.cleanConceptInput(yamlConcepts),
            concepts = R.values(conceptMap);

        // Sort the blocks by meta vs instance (ie, meta ... instance)
        var meta = R.filter(Utils.isMetaConcept, concepts),
            instances = R.reject(Utils.isMetaConcept, concepts);

        // Topological sort on the meta blocks
        meta = this._sortConcepts(meta);

        // Create blocks in the given order!
        var metaConcepts = meta.map(R.partial(Utils.getAttribute, conceptMap)),
            metaBlocks = metaConcepts.map(this._createMetaBlock.bind(this));

        // Create primitive types
        this.createPrimitiveMetaBlocks();

        // Add concepts to record for creating instance blocks
        metaConcepts.forEach(this._addToConceptRecord.bind(this));
        return instances;
    };

    /**
     * Create blocks for the toolbar for the primitive types defined in 
     * PRIMITIVES.
     *
     * @return {undefined}
     */
    MDSBlockCreator.prototype.createPrimitiveMetaBlocks = function() {
        var name;
        for (var i = PRIMITIVES.length; i--;) {
            name = PRIMITIVES[i][1];
            this._registerConceptWithTag({name: name}, 'Primitives');
            this._registerConceptWithTag({name: name}, ALL_BLOCKS);
        }
    };

    /**
     * Create the blocks for a given project.
     *
     * @param {Array<String>} projectBlockNames
     * @param {Dictionary} yamlConcepts
     * @return {undefined}
     */
    MDSBlockCreator.prototype.createProject = function(projectBlockNames, yamlConcepts) {
        var instances;

        // Empty old dom stuff
        $(this.tagContainer).empty();
        $(this.workspaceContainer).empty();

        // initialize project stuff
        this.initialize();

        // Create things!
        instances = this.createBlocks(yamlConcepts);

        // Create the current project from projectBlocks names
        var getConceptName = R.partialRight(Utils.getAttribute, 'name'),
            isInProject = R.partial(Utils.contains, projectBlockNames);

        instances = R.filter(R.pipe(getConceptName, isInProject), instances);

        // Create the blocks on the workspace
        setTimeout(function() {
            // Create the project tabs
            this._initializeWorkspaces(instances);
            this._toggleTag(ALL_BLOCKS);
        }.bind(this), 500);
    };

    MDSBlockCreator.prototype._cleanName = function(name) {
        return /[\w\.\-_]+$/.exec(name)[0];
    };

    /**
     * Create a primitive block type such as String, Integer, Double, etc.
     *
     * @param {Primitive} instance
     * @return {Block}
     */
    MDSBlockCreator.prototype._createPrimitiveBlock = function(instance) {
        var mainBlock;
        if (typeof instance !== 'object') {
            // Find the primitive type
            var i = PRIMITIVES.length,
                primitive;

            while (i-- && !primitive) {
                if (PRIMITIVES[i][0].test(instance)) {
                    primitive = PRIMITIVES[i];
                }
            }

            mainBlock = Blockly.Block.obtain(Blockly.getMainWorkspace(), primitive[1]);
            mainBlock.initSvg();
            mainBlock.render();
            mainBlock.setFieldValue(instance.toString(), primitive[2]);
        } else {
            console.error('Unsupported type:', instance);
        }
        return mainBlock;
    };

    /**
     * Create the corresponding blocks for an "instance concept"
     *
     * @param {Concept} concept
     * @return {undefined}
     */
    MDSBlockCreator.prototype._createInstanceConcept = function(instance) {
        var type = R.reject(R.partial(R.eq, 'name'), Object.keys(instance))[0],
            concept = this._concepts[type],
            mainBlock,
            values,
            child;

        // Hack
        if (!concept) {
            // Return a 'string' block for now
            return this._createPrimitiveBlock(instance);
        }

        mainBlock = Blockly.Block.obtain(Blockly.getMainWorkspace(), concept.name);
        values = Object.keys(instance[type]);

        mainBlock.initSvg();
        mainBlock.render();

        // Connect value attributes
        var block, children, i,
            outputConnection, inputConnection, childBlock;
        values.forEach(function(v) {
            // Connect the first statement
            block = mainBlock;
            children = 
                (instance[type][v] instanceof Array ? instance[type][v] : [instance[type][v]])
                    .slice();
            i = 0;

            // Connect the first one to the appropriate connection
            if (children[i]) {
                outputConnection = block.getInput(v).connection;
                childBlock = this._createInstanceConcept(children[i++]);
                inputConnection = childBlock.previousConnection || childBlock.outputConnection;
                outputConnection.connect(inputConnection);
                block = childBlock;

                while (i < children.length) {
                    childBlock = this._createInstanceConcept(children[i++]);
                    if (childBlock) {
                        inputConnection = childBlock.previousConnection;
                        outputConnection = block.nextConnection;
                        outputConnection.connect(inputConnection);
                    }

                    // Step forward...
                    block = childBlock;
                }
            }
        },this);

        return mainBlock;
    };

    /**
     * Create the input for the blockly blocks.
     *
     * @param {Concept} concept
     * @return {Block}
     */
    MDSBlockCreator.prototype._createMetaBlock = function(concept) {
        console.log('Creating Block for ', concept.name);
        var name = Utils.capitalize(concept.name);
        var init= function() {
            this.setTooltip(concept.description);

            // Make it a statement with connections to prior and subsequent blocks
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            //this.setOutput(true/*, name*/);

            // For each of the "properties", create an input
            console.log('concept is', concept);
            var properties = Object.keys(concept.properties),
                displayName,
                type,
                input;

            // Add name
            var formattedName = concept.name.split('_').reduce(function(p,c) {
                return p+Utils.capitalize(c)+' ';
            }, '');

            this.appendDummyInput().appendField(formattedName);
            for (var i = 0; i < properties.length; i++) {  // Order may be more intuitive

                displayName = properties[i].replace(/_/g, ' ');
                type = Utils.capitalize(concept.properties[properties[i]].type || 'Default');

                if (type.toLowerCase() === 'list') {
                    displayName += ':';
                    input = this.appendStatementInput(properties[i]);
                } else {
                    input = this.appendValueInput(properties[i]);
                }

                // Set the acceptable types
                input.setCheck(type)
                // Pretty things up 
                .appendField(displayName)
                .setAlign(Blockly.ALIGN_RIGHT);

                if (input.description) {
                    input.setTooltip(input.description);
                }
            }

            this.setColour(Math.random()*360);
        };

        this._addBlock(concept.name, 'Basic Examples');  // FIXME: Remove this
        this._createCodeGenerator(concept);

        // Record tags
        concept.tags = concept.tags || [];
        concept.tags.forEach(this._registerConceptWithTag.bind(this, concept));
        this._registerConceptWithTag(concept, ALL_BLOCKS);

        return Blockly.Blocks[concept.name] = {init: init};  // jshint ignore: line
    };

    /* * * * * * * * * * * Workspaces * * * * * * * * * * */

    /**
     * Save the current workspace.
     *
     * @return {undefined}
     */
    MDSBlockCreator.prototype._saveWorkspace = function() {
        var serialized;

        if (this.currentWorkspace) {
            try {
                serialized = Blockly.Python.workspaceToCode(Blockly.getMainWorkspace());
                this.workspaces[this.currentWorkspace] = {instance: yaml.load(serialized),
                                                          yaml: serialized};
            } catch (e) {
                console.error('Could not save changes to '+this.currentWorkspace, e);
            }
        }
    };

    MDSBlockCreator.prototype._initializeWorkspaces = function(instances) {
        // Add the workspaces
        instances.forEach(function(i) {
            this.workspaces[i.name] = {instance: i, yaml: ''};

            // Create HTML
            this._createWorkspaceButton(i.name);
            
        }, this);

        if (instances.length) {
            this._populateWorkspace(instances[0].name);
        }

        // Add new button
        var btn = document.createElement('a');
        btn.setAttribute('class', DEFAULT_CLASS.WORKSPACE);
        btn.innerHTML = 'Create new...';
        btn.onclick = this._createNewWorkspace.bind(this, btn);
        this.workspaceContainer.appendChild(btn);
    };

    MDSBlockCreator.prototype._createWorkspaceButton = function(wksp, beforeBtn) {
        var btn = document.createElement('a');
        btn.setAttribute('class', DEFAULT_CLASS.WORKSPACE);
        btn.innerHTML = wksp;
        btn.onclick = this._populateWorkspace.bind(this, wksp);

        this.workspaceBtns[wksp] = btn;
        if (beforeBtn) {
            this.workspaceContainer.insertBefore(btn, beforeBtn);
        } else {
            this.workspaceContainer.appendChild(btn);
        }

        return btn;
    };

    /**
     * Populate the workspace with an instance block
     *
     * @param {String} name
     * @return {undefined}
     */
    MDSBlockCreator.prototype._populateWorkspace = function(name) {
        // Cleanly exit the current workspace if necessary
        if (this.currentWorkspace) {
            // Store the old info
            this._saveWorkspace();

            // Empty the workspace
            Blockly.mainWorkspace.clear();
            this.workspaceBtns[this.currentWorkspace].setAttribute('class', DEFAULT_CLASS.WORKSPACE);
        }

        // Update the workspace
        this.currentWorkspace = name;
        this.workspaceBtns[name].setAttribute('class', SELECTED_CLASS.WORKSPACE);

        // Populate the workspace if necessary
        if (this.workspaces[name].instance) {
            this._createInstanceConcept(this.workspaces[name].instance);
        }
    };

    MDSBlockCreator.prototype._createNewWorkspace = function(newButton) {
        var name = prompt('Enter the name for the new project', 'My New Project');
        while (name && this.workspaces[name]) {  // TODO: Validate the name
            name = prompt('Enter the name for the new project', name);
        }

        // Create the workspace!
        if (name) {
            this.workspaces[name] = {};
            this._createWorkspaceButton(name, newButton);
        }
    };

    /* * * * * * * * * * * END Workspaces * * * * * * * * * * */

    /* * * * * * * * * * * TAGS * * * * * * * * * * */

    /**
     * Register the concept with the given tag
     *
     * @param concept
     * @param tag
     * @return {undefined}
     */
    MDSBlockCreator.prototype._registerConceptWithTag = function(concept, tag) {
        if (!this.tags[tag]) {
            // Create the UI element
            this._createTag(tag);
        }

        this.tags[tag].push(concept.name);
    };

    MDSBlockCreator.prototype._createTag = function(tag) {
        var t = this._createTagButton(tag);
        this.tagContainer.appendChild(t);
        this.tags[tag] = [];
        this.tagButtons[tag] = t;
    };

    /**
     * Create the UI component of the tag
     *
     * @param {String} tag
     * @return {undefined}
     */
    MDSBlockCreator.prototype._createTagButton = function(tag) {
        var btn = document.createElement('a');
        btn.setAttribute('class', DEFAULT_CLASS.TAG);
        btn.innerHTML = tag;
        btn.onclick = this._toggleTag.bind(this, tag);
        
        return btn;
    };

    /**
     * Toggle the given tag and update the blocks.
     *
     * @param {String} tag
     * @return {undefined}
     */
    MDSBlockCreator.prototype._toggleTag = function(tag) {
        var i = this.activeTags.indexOf(tag),
            changed = false;

        console.log('Toggling tag: "'+tag+'"');
        if (i > -1) {
            if (this.activeTags.length > 1) {
                this.activeTags.splice(i, 1);
                this.tagButtons[tag].setAttribute('class', DEFAULT_CLASS.TAG);
                changed = true;
            }
        } else {
            this.activeTags.push(tag);
            this.tagButtons[tag].setAttribute('class', SELECTED_CLASS.TAG);
            changed = true;
        }

        if (changed) {
            this._updateBlockToolbox();
        }
    };
    /* * * * * * * * * * * END TAGS * * * * * * * * * * */

    /**
     * Create the code generating function for the given block.
     *
     * @param {Concept} concept
     * @return {undefined}
     */
    MDSBlockCreator.prototype._createCodeGenerator = function(concept) {
        Blockly.Python[concept.name] = this._getCodeFunction.bind(this, concept);
    };

    /**
     * Create the code given the fields.
     *
     * @param {Dictionary<name --> type>} fields
     * @return {undefined}
     */
    MDSBlockCreator.prototype._getCodeFunction = function(concept, block) {
        // For each property, check if it is a list type
        var fields = concept.properties,
            names = Object.keys(fields),
            type,
            snippet,
            code = concept.name+':\n';

        for (var i = 0; i < names.length; i++) {
            type = fields[names[i]].type;
            if (type === 'list') {
                snippet = Blockly.Python.statementToCode(block, names[i]);
                // Convert the snippet into YAML array format
                snippet = '\n'+Utils.yamlListToArray(snippet);
            } else {
                snippet = (Blockly.Python.valueToCode(block, names[i], Blockly.Python.ORDER_NONE) || '');
            }
            code += '  '+names[i]+': '+snippet+'\n';
        }
        return code;
    };

    /**
     * Add a block with the given id to the toolbox.
     *
     * @param {String} id
     * @return {undefined}
     */
    MDSBlockCreator.prototype._addBlock = function(id, category) {
        var block = document.createElement('block');

        block.setAttribute('type', id);


        // Add blocks by the tags
        // TODO

        // Find the correct category using BFS
        var current = [this.toolbox],
            node,
            tag,
            next;

        while (current.length) {
            next = [];
            for (var i = current.length; i--;) {
                node = current[i];
                if (node.getAttribute('name') === category) {
                    return node.appendChild(block);
                } else {
                    // Filter the nodes as we add them to "next"
                    for (var j = node.childNodes.length; j--;) {
                        tag = (node.childNodes[j].tagName || '').toLowerCase();
                        if (tag === 'category' || tag === 'xml') {
                            next.push(node.childNodes[j]);
                        }
                    }
                }
            }
            current = next;
        }

        node.appendChild(block);
    };

    MDSBlockCreator.prototype._updateBlockToolbox = function() {
        var blocks,
            tree;  // tree representation of the blocks to be shown

        // Get all blocks for each tag
        blocks = this.activeTags.reduce(function(prev, curr) {
            return prev.concat(this.tags[curr]);
        }.bind(this), []);

        blocks = Utils.removeDuplicates(blocks);

        // Convert this to text xml form
        tree = '<xml>'+blocks.map(this._getBlockXml).join('\n')+'</xml>';

        Blockly.getMainWorkspace().updateToolbox(tree);
    };

    /**
     * Get the xml representation for the given block name.
     *
     * @param {String} name
     * @return {String}
     */
    MDSBlockCreator.prototype._getBlockXml = function(name) {
        return '<block type="'+name+'"></block>';
    };

    /**
     * Get the data to save in the project.
     *
     * @return {Dictionary<Filename, Content>}
     */
    MDSBlockCreator.prototype.getSaveData = function() {
        this._saveWorkspace();
        return R.mapObj(R.partialRight(Utils.getAttribute, 'yaml'), this.workspaces);
    };

    global.MDSBlockCreator = MDSBlockCreator;
})(this);
