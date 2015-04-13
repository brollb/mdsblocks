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
        return R.values(concepts);
    };

    /**
     * Topological sort of the concepts.
     *
     * @param {Array<Concept>}concepts
     * @return {undefined}
     */
    MDSBlockCreator.prototype._sortConcepts = function(concepts) {
        var nodes = this._createGraph(R.clone(concepts)),
            dict = Utils.createDictionary(Utils.getAttribute('name'), concepts),
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
        console.log('nodeDict', nodeDict);
        
        // Sort the remaining nodes
        var independents, 
            orderedNodes = [];
        while (Object.keys(nodeDict).length) {
            independents = R.pickBy(Utils.isEmpty, nodeDict);
            if (!independents.length) {
                console.error('There is no topological sort for the given blocks!');
                break;
            }
            // Pick 
            while (independents.length) {
            }
        }
    };

    /**
     * Return a list of nodes where a node has edges to it's dependencies.
     *
     * @param {Array<Concept>}concepts
     * @return {Array<ConceptNodes>}
     */
    MDSBlockCreator.prototype._createGraph = function(concepts) {
        // For each concept, create a node with edges to it's dependencies
        // Ignore dependencies that are non-concepts (atomic)
        var names = R.map(Utils.getAttribute('name'), concepts),
            properties = R.map(Utils.getAttribute('properties'), concepts),
            getTypes = R.partial(R.mapObj, Utils.getAttribute('type'));

        // For each property, get the type
        properties = R.map(getTypes, properties);
        console.log('properties:', properties);
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
        var concepts = this.cleanConceptInput(yamlConcepts);

        // Sort the blocks by meta vs instance (ie, meta ... instance)
        // TODO

        // Topological sort on the meta blocks
        // TODO

        // Create blocks in the given order!
        // TODO
    };

    MDSBlockCreator.prototype.createBlock = function(name, yamlContent, category) {
        var concept = yaml.load(yamlContent);

        concept.name = name;

        // Create the block from the concept json
        Blockly.Blocks[name] = {
            init: this._createInitFn(concept)
        };

        // Add the block to the toolbox
        this._addBlock(name, category);
    };

    MDSBlockCreator.prototype._createInitFn = function(concept) {
        // Divide the concepts based on a couple basic block types
        if (concept.properties && concept.description) {
            this._createMetaBlock(concept);
        } else {
            this._createInstanceBlock(concept);
        }
    };

    MDSBlockCreator.prototype._createInstanceBlock = function(concept) {
        // Contains a single key. This key tells the block to create.
        // Then we will connect the appropriate blocks to the inputs ('properties')
        // TODO
    };

    MDSBlockCreator.prototype._createMetaBlock = function(concept) {
        return function() {
            this.setTooltip(concept.description);

            // Make it a statement with connections to prior and subsequent blocks
            this.setPreviousStatement(true);
            this.setNextStatement(true);

            // For each of the "properties", create an input
            console.log('concept is', concept);
            var properties = Object.keys(concept.properties),
                displayName,
                type,
                input;

            for (var i = 0; i < properties.length; i++) {  // Order may be more intuitive

                displayName = properties[i].replace(/_/g, ' ');
                type = Utils.capitalize(concept.properties[properties[i]].type || '');

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

                // Add typechecking?
                // TODO
            }

            // Handle the required input?
            // TODO 
            // Set the output?
            // TODO

            // Set the color intelligently? Perhaps based on the output...
            // TODO

            this.setColour(Math.random()*360);
        };
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
