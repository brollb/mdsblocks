/*globals R,Utils,Blockly,yaml*/
/*
 * The MDSBlockCreator takes a concept JSON file and creates a blockly code block from it.
 */
(function(global) {
    'use strict';
    var count = 0;

    /**
     * MDSBlockCreator
     *
     * @constructor
     * @param {DOM Element} toolbox
     * @return {undefined}
     */
    var MDSBlockCreator = function(toolbox) {
        this.toolbox = toolbox;
    };

    MDSBlockCreator.prototype.isMetaConcept = function(concept) {
        return R.has('description', concept) && R.has('properties', concept);
    };

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
     * @return {undefined}
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
    };

    MDSBlockCreator.prototype._cleanName = function(name) {
        return /[\w\.\-_]+$/.exec(name)[0];
    };

    MDSBlockCreator.prototype.createBlock = function(name, yamlContent, category) {
        var concept = yaml.load(yamlContent);

        concept.name = this._cleanName(name);  // Remove the filename from the path

        // Create the block from the concept json
        Blockly.Blocks[name] = this._createGenericBlock(concept);

        // Add the block to the toolbox
        this._addBlock(name, category);
    };

    MDSBlockCreator.prototype.renderBlocks = function() {
        // TODO
    };

    MDSBlockCreator.prototype._createGenericBlock = function(concept) {
        // Divide the concepts based on a couple basic block types
        if (this.isMetaConcept(concept)) {
            return this._createMetaBlock(concept);
        }

        return this._createInstanceBlock(concept);
    };

    MDSBlockCreator.prototype._createInstanceBlock = function(concept) {
        // Contains a single key. This key tells the block to create.
        // Then we will connect the appropriate blocks to the inputs ('properties')
        // TODO
    };

    /**
     * Create the input for the blockly blocks.
     *
     * @param concept
     * @return {undefined}
     */
    MDSBlockCreator.prototype._createMetaBlock = function(concept) {
        console.log('Creating Meta Block. Concept is', concept);
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

            // Handle the required input?
            // TODO 
            // Set the output?
            // TODO

            // Set the color intelligently? Perhaps based on the output...
            // TODO

            this.setColour(Math.random()*360);
        };

        this._addBlock(name, 'Basic Examples');
        return Blockly.Blocks[name] = {init: init};

        // Add the block to the toolbox
        //return {init: init};
    };

    //MDSBlockCreator.prototype._addFieldToBlock = function(id, category)

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
