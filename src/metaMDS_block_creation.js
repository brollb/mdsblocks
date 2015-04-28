/*globals R,Utils,Blockly,yaml*/
/*
 * The MDSBlockCreator takes a concept JSON file and creates a blockly code block from it.
 */
(function(global) {
    'use strict';
    var count = 0,
        PRIMITIVES = [
            [ /\.*/, 'text', 'TEXT' ],
            [ /\d*\.\d+/, 'math_number', 'NUM' ],  // Float
            [ /\d+/, 'math_number', 'NUM' ]  // Integer
        ];

    /**
     * MDSBlockCreator
     *
     * @constructor
     * @param {DOM Element} toolbox
     * @return {undefined}
     */
    var MDSBlockCreator = function(toolbox) {
        this.toolbox = toolbox;
        this._concepts = {};
    };

    /**
     * Check if a block is the definition of a concept type.
     *
     * @param concept
     * @return {undefined}
     */
    MDSBlockCreator.prototype.isMetaConcept = function(concept) {
        return R.has('description', concept) && R.has('properties', concept);
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
        var meta = R.filter(this.isMetaConcept, concepts),
            instances = R.reject(this.isMetaConcept, concepts);

        // Topological sort on the meta blocks
        meta = this._sortConcepts(meta);

        // Create blocks in the given order!
        var metaConcepts = meta.map(R.partial(Utils.getAttribute, conceptMap)),
            metaBlocks = metaConcepts.map(this._createMetaBlock.bind(this));

        // Add concepts to record for converting blocks to code
        metaConcepts.forEach(this._addToConceptRecord.bind(this));
        return instances;
    };

    /**
     * Create the blocks for a given project.
     *
     * @param {Array<String>} projectBlockNames
     * @param {Dictionary} yamlConcepts
     * @return {undefined}
     */
    MDSBlockCreator.prototype.createProject = function(projectBlockNames, yamlConcepts) {
        var instances = this.createBlocks(yamlConcepts);

        // Create the current project from projectBlocks names
        var getConceptName = R.partialRight(Utils.getAttribute, 'name'),
            isInProject = R.partial(Utils.contains, projectBlockNames);

        instances = R.filter(R.pipe(getConceptName, isInProject), instances);

        // Create the blocks on the workspace
        setTimeout(function() {
            instances.forEach(this._createInstanceConcept.bind(this));
        }.bind(this), 500);
    };

    MDSBlockCreator.prototype._cleanName = function(name) {
        return /[\w\.\-_]+$/.exec(name)[0];
    };

    //MDSBlockCreator.prototype.createBlock = function(name, yamlContent, category) {
        //var concept = yaml.load(yamlContent);

        //concept.name = this._cleanName(name);  // Remove the filename from the path

        //// Create the block from the concept json
        //Blockly.Blocks[name] = this._createGenericBlock(concept);

        //// Add the block to the toolbox
        //this._addBlock(name, category);
    //};

    //MDSBlockCreator.prototype._createGenericBlock = function(concept) {
        //// Divide the concepts based on a couple basic block types
        //if (this.isMetaConcept(concept)) {
            //return this._createMetaBlock(concept);
        //}

        //return this._createInstanceBlock(concept);
    //};

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
            outputConnection = block.getInput(v).connection;
            childBlock = this._createInstanceConcept(children[i++]);
            if (childBlock) {
                inputConnection = childBlock.previousConnection || childBlock.outputConnection;
                outputConnection.connect(inputConnection);
                block = childBlock;
            }

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

        this._addBlock(concept.name, 'Basic Examples');
        this._createCodeGenerator(concept);

        return Blockly.Blocks[concept.name] = {init: init};
    };

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

    global.MDSBlockCreator = MDSBlockCreator;
})(this);
